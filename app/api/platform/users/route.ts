import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticatePlatformApiKey } from "@/lib/platform-api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authResult = await authenticatePlatformApiKey(req, ["platform:users"]);

  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.appUsers.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      isActive: true,
      role: true,
      isEntraUser: true,
      createdAt: true,
      updatedAt: true,
      lastLoggedIn: true,
      _count: {
        select: {
          sessions: true,
          mailboxes: true,
        },
      },
    },
  });

  return NextResponse.json({ users });
}