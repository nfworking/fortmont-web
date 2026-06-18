import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
 
) {

  try {
      const session = await auth();
  
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }


  const body = await req.json();

  // optional safety check (highly recommended)
  
  const user = await prisma.appUsers.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    );
  }

  const notification = await prisma.notifications.create({
    data: {
      userId: user.id,
      type: body.type,
      title: body.title,
      description: body.description ?? "This is a new notification",
      read: body.read ?? false,
    },
  });

  return NextResponse.json(notification);
}
catch (error) {
  console.error("Error creating notification:", error);
  return NextResponse.json(
    { error: "Failed to create notification" },
    { status: 500 }
  );
}
}