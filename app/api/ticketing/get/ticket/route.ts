import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth"; // adjust to your setup

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // FIXED: Changed session.user.session to session.user.role
  const enrichedUser = session.user as any; // Cast to bypass temporary TS type filtering if needed
  const isAdmin = enrichedUser.role === "ticket_admin";

  const tickets = await prisma.tickets.findMany({
    where: {
      ...(isAdmin
        ? {
            OR: [
              { status: null },
              { status: { not: "closed" } },
              { assignedToId: null },
            ],
          }
        : {
            assignedToId: session.user.id,
            OR: [{ status: null }, { status: { not: "closed" } }],
          }),
    },
    include: {
      createdBy: true,
      assignedTo: true,
      comments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(tickets, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}