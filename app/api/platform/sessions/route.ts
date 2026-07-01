import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticatePlatformApiKey } from "@/lib/platform-api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authResult = await authenticatePlatformApiKey(req, ["platform:sessions"]);

  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.userSession.findMany({
    where: { expiresAt: { gt: new Date() } },
    orderBy: { lastActive: "desc" },
    take: 100,
    select: {
      id: true,
      userId: true,
      sessionToken: true,
      userAgent: true,
      ipAddress: true,
      cookieVersion: true,
      createdAt: true,
      lastActive: true,
      expiresAt: true,
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

  return NextResponse.json({ sessions });
}