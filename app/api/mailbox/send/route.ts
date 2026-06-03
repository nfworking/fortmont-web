import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/mailboxPassword";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow"; // Import this to append the mail

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Parse request body
    const { to, subject, text, html } = await request.json();
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3. Get mailbox configuration
    const mailbox = await prisma.userMailbox.findFirst({
      where: { userId },
    });
    if (!mailbox) {
      return NextResponse.json({ error: "No mailbox linked" }, { status: 404 });
    }

    const password = decrypt(mailbox.encryptedPassword);

    // 4. Create SMTP Transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!, 
      port: 465, 
      secure: true, 
      auth: {
        user: mailbox.email,
        pass: password,
      },
    });

    const senderHeader = `"${session.user.name || 'User'}" <${mailbox.email}>`;

    // 5. Send the email via SMTP
    const info = await transporter.sendMail({
      from: senderHeader,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    // 6. MAILCOW FIX: Manually append the email to the IMAP Sent folder
    try {
      const imapClient = new ImapFlow({
        host: process.env.IMAP_HOST!,
        port: 993,
        secure: true,
        auth: {
          user: mailbox.email,
          pass: password,
        },
      });

      await imapClient.connect();
      
      // Find the proper Sent folder name on Mailcow (usually "Sent" or "Sent Items")
      const list = await imapClient.list();
      const sentFolder = list.find(f => f.specialUse === "\\Sent")?.path || "Sent";

      // Reconstruct a simple RFC822 raw message format for IMAP upload
      // Mailcow needs a clean separation of headers and body (\r\n\r\n)
      const dateHeader = new Date().toUTCString();
      const rawMessage = 
        `From: ${senderHeader}\r\n` +
        `To: ${to}\r\n` +
        `Subject: ${subject}\r\n` +
        `Date: ${dateHeader}\r\n` +
        `Content-Type: ${html ? 'text/html' : 'text/plain'}; charset=utf-8\r\n` +
        `\r\n` + 
        `${html || text}`;

      // Append to the Sent folder and mark it as \Seen (read) so it doesn't look unread
      await imapClient.append(sentFolder, rawMessage, ["\\Seen"]);
      await imapClient.logout();
      
    } catch (imapError) {
      // We wrap this in a try/catch so that if the IMAP sync fails, 
      // the user still knows their email was successfully delivered via SMTP.
      console.error("SMTP succeeded, but failed to append copy to Mailcow Sent folder:", imapError);
    }

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });

  } catch (err) {
    console.error("EMAIL_SEND_ERROR:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}