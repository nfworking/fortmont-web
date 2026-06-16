import { NextRequest } from "next/server";
import { createClient } from "redis";

// Force the route to bypass build-time static generation pings
export const dynamic = "force-dynamic"; 

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const subscriber = createClient({ url: redisUrl });

  // Guard flag to prevent stream interactions during/after teardown
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to cleanly send structured text chunks to the client
      const emit = (data: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (e) {
            // Stream might have already closed mid-transit
          }
        }
      };

      try {
        // Handle any client-side Redis connection errors gracefully
        subscriber.on('error', (err) => {
          if (!isClosed) {
            console.error("Redis client stream error:", err);
          }
        });

        await subscriber.connect();

        // THE HANDSHAKE: Send an immediate confirmation to keep the line alive
        emit("retry: 10000\n"); // Tells browser to wait 10s before retrying if dropped
        emit("data: {\"status\":\"connected\"}\n\n");

        // Subscribe to your Redis channel
        await subscriber.subscribe(`ticket:${ticketId}:comments`, (message) => {
          emit(`data: ${message}\n\n`); // Must have double newline trailing format
        });
      } catch (err) {
        if (!isClosed) {
          console.error("Redis connection stream error:", err);
          controller.error(err);
        }
      }

      // Cleanup hook fired when the user closes their sheet drawer, closes browser tab, or refreshes
      req.signal.addEventListener("abort", async () => {
        isClosed = true;
        try {
          // Unsubscribe from the specific channel first
          if (subscriber.isOpen) {
            await subscriber.unsubscribe(`ticket:${ticketId}:comments`);
          }
        } catch (err) {
          // Suppress errors during intentional teardown
        } finally {
          try {
            // Safely close the Redis connection loop
            if (subscriber.isOpen) {
              await subscriber.quit();
            }
          } catch (err) {
            // Suppress errors during intentional teardown
          } finally {
            // FIX: Wrap in a try/catch to prevent the "Controller is already closed" crash
            try {
              controller.close();
            } catch (e) {
              // If it's already closed by the runtime, we safely ignore it and move on
            }
          }
        }
      });
    },
  });

  // Return the explicit web stream with anti-buffering optimization flags
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Mandatory: Prevents NGINX/Proxies from buffering the line
    },
  });
}