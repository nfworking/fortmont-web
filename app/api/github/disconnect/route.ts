// app/api/github/disconnect/route.ts
// Deletes the GitHubLink record, effectively unlinking the account.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.gitHubLink.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "No GitHub account linked" },
      { status: 404 }
    );
  }

  await prisma.gitHubLink.delete({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true, message: "GitHub account unlinked" });
}