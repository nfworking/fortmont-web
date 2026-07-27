import { createClient } from "redis";

export const redis = createClient({
  url: process.env.REDIS_URL || "redis://172.20.0.25:6379",
});

redis.on("error", (err) => console.error("Redis Error:", err));

let connected = false;

export async function getRedis() {
  if (!connected) {
    await redis.connect();
    connected = true;
  }
  return redis;
}

// Creates a dedicated duplicate client for pub/sub subscriptions.
// A subscriber client can't run normal commands, so each SSE
// connection needs its own instance rather than sharing `redis`.
export async function createSubscriberClient() {
  const sub = redis.duplicate();
  sub.on("error", (err) => console.error("Redis Subscriber Error:", err));
  await sub.connect();
  return sub;
}

export function notificationChannel(userId: string) {
  return `notifications:${userId}`;
}