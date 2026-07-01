import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ active: false }, { status: 400 });
    }

    const activeSession = await prisma.userSession.findUnique({
      where: { sessionToken: sessionId },
    });

    if (!activeSession || activeSession.expiresAt < new Date()) {
      return NextResponse.json({ active: false });
    }

    return NextResponse.json({ active: true });
  } catch (error) {
    console.error("Session verification failed:", error);
    return NextResponse.json({ active: false });
  }
}