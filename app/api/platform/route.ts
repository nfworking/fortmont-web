import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticatePlatformApiKey } from "@/lib/platform-api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authResult = await authenticatePlatformApiKey(req, ["platform:read"]);

  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [userCount, activeUserCount, sessionCount, mailboxCount, appCount, storageAggregate] = await Promise.all([
    prisma.appUsers.count(),
    prisma.appUsers.count({ where: { isActive: true } }),
    prisma.userSession.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.userMailbox.count(),
    prisma.apps.count(),
    prisma.userStorage.aggregate({
      _sum: { quotaBytes: true, usedBytes: true },
    }),
  ]);

  return NextResponse.json({
    platform: {
      users: {
        total: userCount,
        active: activeUserCount,
      },
      sessions: {
        active: sessionCount,
      },
      mailboxes: {
        total: mailboxCount,
      },
      apps: {
        total: appCount,
      },
      storage: {
        totalQuotaBytes: storageAggregate._sum.quotaBytes ? Number(storageAggregate._sum.quotaBytes) : 0,
        totalUsedBytes: storageAggregate._sum.usedBytes ? Number(storageAggregate._sum.usedBytes) : 0,
      },
      generatedAt: new Date().toISOString(),
    },
  });
}