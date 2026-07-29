import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { resolveTicketingActor } from "@/lib/ticketing-auth";
import { formatBytes } from "@/lib/storage";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveTicketingActor(req);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const usedStorage = await prisma.userStorage.findUnique({
    where: {
      userId: actor.userId,
    },
    select: {
      usedBytes: true,
    },
  });
  return NextResponse.json(
    {
      usedStorage: usedStorage ? formatBytes(Number(usedStorage.usedBytes)) : null,
    },
    {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}