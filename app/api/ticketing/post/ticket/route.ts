import { NextResponse } from "next/server";

import { TicketPriority } from "@/app/generated/prisma/enums";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/sendNotification";
import { sendUserNotification } from "@/lib/sendDeviceNotification";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

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
    include: {
      createdBy: true,
      assignedTo: true,
    },
  });

  if (ticket.assignedTo?.email) {
    const assigneeName =
      ticket.assignedTo.displayName ?? ticket.assignedTo.username ?? ticket.assignedTo.email;
    const creatorName =
      ticket.createdBy?.displayName ??
      ticket.createdBy?.username ??
      ticket.createdBy?.email ??
      "Unknown creator";

    try {
      await sendEmail({
        to: ticket.assignedTo.email,
        subject: `Ticket assigned: ${ticket.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
            <h2 style="margin: 0 0 12px;">New ticket assigned to you</h2>
            <p>Hello ${escapeHtml(assigneeName)},</p>
            <p>A ticket has been assigned to you in Fortmont Web.</p>
            <table style="border-collapse: collapse; margin: 16px 0;">
              <tr>
                <td style="padding: 4px 12px 4px 0; color: #6b7280;">Subject</td>
                <td style="padding: 4px 0;">${escapeHtml(ticket.subject)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 12px 4px 0; color: #6b7280;">Priority</td>
                <td style="padding: 4px 0;">${escapeHtml(ticket.priority)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 12px 4px 0; color: #6b7280;">Type</td>
                <td style="padding: 4px 0;">${escapeHtml(ticket.type)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 12px 4px 0; color: #6b7280;">Department</td>
                <td style="padding: 4px 0;">${escapeHtml(ticket.department)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 12px 4px 0; color: #6b7280;">Created by</td>
                <td style="padding: 4px 0;">${escapeHtml(creatorName)}</td>
              </tr>
            </table>
            <p style="margin-top: 16px;">${escapeHtml(ticket.description)}</p>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send ticket assignment email", error);
    }
  }

  const notificationTitle = `New ticket assigned: ${ticket.subject}`;
  const notificationDescription = ` Priority: ${ticket.priority}, Type: ${ticket.type}, Department: ${ticket.department}`;

  try {
    await sendNotification({
      userId: ticket.assignedToId!,
      type: ticket.department,
      title: notificationTitle,
      description: notificationDescription,
    });
  } catch (error) {
    console.error("Failed to send ticket assignment notification", error);
  }

    try {
      await sendUserNotification({
        userId: ticket.assignedToId!,
        title: notificationTitle,
        body: notificationDescription,
      });
    }
    catch (error) {
      console.error("Failed to send device notification for ticket assignment", error);
    }

  return NextResponse.json(ticket);
}
