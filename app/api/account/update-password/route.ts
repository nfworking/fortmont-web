import {prisma} from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {hashPassword, verifyPassword} from "@/lib/password";
import { NextRequest, NextResponse } from "next/server";
import { revokeUserSessions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "currentPassword and newPassword are required" },
        { status: 400 }
      );
    }

    const user = await prisma.appUsers.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    });
    
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "User not found or password not set" },
        { status: 404 }
      );
    }

    const isCurrentPasswordValid = verifyPassword(currentPassword, user.passwordHash);

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 403 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.appUsers.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    });

    await revokeUserSessions(session.user.id);
    
    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}