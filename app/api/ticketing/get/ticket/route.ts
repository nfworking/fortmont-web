import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export async function GET() {
  const tickets = await prisma.tickets.findMany({
    include: {
      createdBy: true,
      assignedTo: true,
    },
  });

  return NextResponse.json(tickets);
}