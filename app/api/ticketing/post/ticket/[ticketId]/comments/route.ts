// app/api/tickets/[ticketId]/comments/route.ts (or your matching route path)
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "redis"; // Import the Redis client

// Setup a reusable redis publisher client
const redisUrl = process.env.REDIS_URL || "redis://172.20.0.25:6379";
const publisher = createClient({ url: redisUrl });

// Connect to Redis immediately on startup/invocation
publisher.connect().catch((err) => console.error("Redis Publisher Connection Error", err));

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

    // 🔥 BROADCAST TO REDIS PUB/SUB
    // We convert the comment to a JSON string and publish it to a ticket-specific channel
    try {
      await publisher.publish(`ticket:${ticketId}:comments`, JSON.stringify(newComment));
    } catch (redisError) {
      console.error("Failed to publish real-time notification to Redis:", redisError);
      // We don't crash the request if Redis notifications temporarily fail
    }

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error("Failed to add comment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}