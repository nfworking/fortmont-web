import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/mailboxPassword";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export async function GET() {
  try {
    // 1. Auth
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Get mailbox
    const mailbox = await prisma.userMailbox.findFirst({
      where: { userId },
    });

    if (!mailbox) {
      return NextResponse.json(
        { error: "No mailbox linked" },
        { status: 404 }
      );
    }

    const password = decrypt(mailbox.encryptedPassword);

    // 3. IMAP client
    const client = new ImapFlow({
      host: process.env.IMAP_HOST!,
      port: 993,
      secure: true,
      auth: {
        user: mailbox.email,
        pass: password,
      },
    });

    await client.connect();
    await client.mailboxOpen("INBOX");

    // 4. Ensure mailbox is valid (fix for TS + runtime safety)
    if (!client.mailbox) {
      throw new Error("Failed to open mailbox");
    }

    const total = client.mailbox.exists;

    // 5. Get last 50 messages safely
    const start = Math.max(1, total - 49);
    const range = `${start}:*`;

    const messages: any[] = [];

    for await (const msg of client.fetch(range, {
      uid: true,
      envelope: true,
      flags: true,
      internalDate: true,
      source: true,
    })) {
      messages.push(msg);
    }

    // 6. Newest first (manual reverse fix)
    messages.reverse();

    // 7. Parse emails
    const emails = [];

    for (const msg of messages) {
      let parsed = null;

      if (msg.source) {
        try {
          parsed = await simpleParser(msg.source);
        } catch (err) {
          console.error(`Parse error UID ${msg.uid}:`, err);
        }
      }

      emails.push({
        uid: msg.uid,
        subject: msg.envelope?.subject ?? "(no subject)",
        from: msg.envelope?.from?.[0]?.address ?? "",
        date: msg.internalDate,
        flags: msg.flags,
        body: {
          text: parsed?.text ?? "",
          html: parsed?.html ?? parsed?.textAsHtml ?? "",
        },
      });
    }

    // 8. Cleanup
    await client.logout();

    // 9. Response
    return NextResponse.json({
      mailbox: mailbox.email,
      count: emails.length,
      emails,
    });
  } catch (err) {
    console.error("EMAIL_INBOX_ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}