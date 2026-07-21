import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveTicketingActor(req);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = actor.userRole === "admin" || actor.userRole === "ticket_admin";

  // 4. FETCH TICKETS
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
            assignedToId: actor.userId,
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