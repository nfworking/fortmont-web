import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticatePlatformApiKey } from "@/lib/platform-api";

export const runtime = "nodejs";

function serializeBigInt(value: bigint) {
  return value.toString();
}

export async function GET(req: Request) {
  const authResult = await authenticatePlatformApiKey(req, ["platform:storage"]);

  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const storage = await prisma.userStorage.findMany({
    orderBy: { usedBytes: "desc" },
    take: 100,
    select: {
      userId: true,
      quotaBytes: true,
      usedBytes: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    storage: storage.map((entry) => ({
      userId: entry.userId,
      quotaBytes: serializeBigInt(entry.quotaBytes),
      usedBytes: serializeBigInt(entry.usedBytes),
      user: entry.user,
    })),
  });
}