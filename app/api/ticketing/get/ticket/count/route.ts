import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const actor = await resolveTicketingActor(req);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }


const openTickets = await prisma.tickets.count({
  where: {
    assignedToId: actor.userId,
    status: "open",
  },
});

  return NextResponse.json({ openTickets }, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}