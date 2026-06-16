import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { ticketId } = await params;
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        text,
        ticketId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error("Failed to add comment:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}