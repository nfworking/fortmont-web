import { NextResponse } from "next/server";

import { TicketPriority } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const tickets = await prisma.tickets.findMany({
    include: {
      createdBy: true,
      assignedTo: true,
    },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: Request) {
  const body = await req.json();

  const {
    type,
    department,
    subject,
    description,
    priority,
    status,
    createdById,
    assignedToId,
  } = body;

  if (!type || !department || !subject || !description || !priority) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const ticket = await prisma.tickets.create({
    data: {
      type,
      department,
      subject,
      description,
      priority: priority as TicketPriority,
      status: status || "open",
      createdById: createdById || null,
      assignedToId: assignedToId || null,
    },
  });

  return NextResponse.json(ticket);
}