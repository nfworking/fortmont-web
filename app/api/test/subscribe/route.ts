import { redis } from "@/lib/redis";

export async function GET() {
  const subscriber = redis.duplicate();
  await subscriber.connect();

  await subscriber.subscribe("test-channel", (message) => {
    console.log("🔥 Redis Event:", message);
  });

  return new Response("Subscribed to Redis (check logs)");
}