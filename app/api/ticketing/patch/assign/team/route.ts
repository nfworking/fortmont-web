import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, userId } = body;

    // 1. Validation
    if (!name) {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    // 2. Create the team and instantly connect the user
    const newTeam = await prisma.team.create({
      data: {
        name,
        description,
        // Because it's a many-to-many relation, we use 'connect' 
        // with an array of user identifier objects
        members: userId ? {
          connect: [{ id: userId }]
        } : undefined,
      },
      // Include members in the response payload to verify it worked
      include: {
        members: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json(newTeam, { status: 201 });

  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create team:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details },
      { status: 500 }
    );
  }
}