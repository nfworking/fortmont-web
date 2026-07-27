import { NextResponse } from "next/server";
import { resolveTicketingActor } from "@/lib/ticketing-auth";
import { createSubscriberClient, notificationChannel } from "@/lib/redis";
import { prisma } from "@/lib/prisma";

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(req: Request) {
  const cors = corsHeaders(req);
  const actor = await resolveTicketingActor(req);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  }

  const userId = actor.userId;
  const channel = notificationChannel(userId);

  const encoder = new TextEncoder();
  let subscriber: Awaited<ReturnType<typeof createSubscriberClient>> | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const notifications = await prisma.notifications.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });
        send("initial", notifications);
      } catch (err) {
        console.error("Failed to load initial notifications:", err);
      }

      subscriber = await createSubscriberClient();
      await subscriber.subscribe(channel, (message) => {
        try {
          const notification = JSON.parse(message);
          send("notification", notification);
        } catch (err) {
          console.error("Failed to parse notification message:", err);
        }
      });

      // Keep the connection alive through proxies/load balancers
      // that kill idle connections (e.g. nginx default 60s timeout).
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: heartbeat\n\n`));
      }, 25000);
    },

    async cancel() {
      if (heartbeat) clearInterval(heartbeat);
      if (subscriber) {
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...cors,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}