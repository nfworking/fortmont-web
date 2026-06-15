import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const ticket = await prisma.tickets.update({
      where: {
        id,
      },
      data: {
        ...(body.type && { type: body.type }),
        ...(body.department && { department: body.department }),
        ...(body.subject && { subject: body.subject }),
        ...(body.description && { description: body.description }),
        ...(body.priority && { priority: body.priority }),
        ...(body.status && { status: body.status }),
        ...(body.createdById !== undefined && {
          createdById: body.createdById,
        }),
        ...(body.assignedToId !== undefined && {
          assignedToId: body.assignedToId,
        }),
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}