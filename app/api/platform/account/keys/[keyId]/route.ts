import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Next.js 15 requires route params to be treated as a Promise
type Context = {
  params: Promise<{ keyId: string }>;
};

export async function DELETE(
  _req: Request,
  { params }: Context,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the asynchronous params object before destructuring its properties
    const { keyId } = await params;

    const existingKey = await prisma.platformApiKey.findUnique({
      where: { id: keyId },
      select: { id: true, userId: true },
    });

    if (!existingKey || existingKey.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.platformApiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API_KEY_DELETE_ERROR]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}