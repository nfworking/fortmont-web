import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticatePlatformApiKey } from "@/lib/platform-api";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authResult = await authenticatePlatformApiKey(req, ["platform:apps"]);

  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apps = await prisma.apps.findMany({
    orderBy: { label: "asc" },
    select: {
      id: true,
      label: true,
      description: true,
      url: true,
    },
  });

  return NextResponse.json({ apps });
}