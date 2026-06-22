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