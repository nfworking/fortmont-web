import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST() {
  await redis.publish(
    "test-channel",
    JSON.stringify({
      message: "Hello from Redis 🚀",
      time: new Date().toISOString(),
    })
  );

  return NextResponse.json({ ok: true });
}