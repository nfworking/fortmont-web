import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

export async function GET(req: Request) {
  const cors = corsHeaders(req);

  try {
    const actor = await resolveTicketingActor(req);

    if (!actor?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: cors }
      );
    }

    const userId = actor.userId;

    const notifications = await prisma.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notifications, { headers: cors });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: cors }
    );
  }
}