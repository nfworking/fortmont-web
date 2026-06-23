import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const usersWithoutStorage = await prisma.appUsers.findMany({
      where: {
        storage: {
          is: null,
        },
      },
      select: {
        id: true,
      },
    });

    if (usersWithoutStorage.length === 0) {
      return NextResponse.json(
        { message: "All existing users already have storage provisioned." },
        { status: 200 }
      );
    }

    const provisioningTasks = usersWithoutStorage.map((user) =>
      prisma.userStorage.create({
        data: {
          userId: user.id,
        },
      })
    );

    await prisma.$transaction(provisioningTasks);

    return NextResponse.json(
      {
        message: `Successfully provisioned storage for ${usersWithoutStorage.length} existing users.`,
        affectedUserIds: usersWithoutStorage.map((u) => u.id),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to provision existing users:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}