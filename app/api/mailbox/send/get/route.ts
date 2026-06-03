import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/mailboxPassword";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export async function GET() {
  try {
    // 1. Auth check
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 2. Get mailbox configuration
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

    // 3. Initialize IMAP client
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
    

    // 4. Dynamically find the "Sent" folder path using special use attributes
    const list = await client.list();
    const sentFolder = list.find(folder => folder.specialUse === "\\Sent");
    
    // Fallback to common names if the server doesn't explicitly flag the specialUse attribute
    const sentFolderName = sentFolder?.path || "Sent"; 

    // 5. Open the Sent folder
    await client.mailboxOpen(sentFolderName);

    if (!client.mailbox) {
      throw new Error(`Failed to open folder: ${sentFolderName}`);
    }

    const total = client.mailbox.exists;

    // 6. Get the last 50 sent messages safely
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

    // 7. Sort newest first
    messages.reverse();

    // 8. Parse sent emails
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

      // Format recipient lists neatly
      const toAddresses = msg.envelope?.to?.map((t: any) => t.address).join(", ") ?? "";

      emails.push({
        uid: msg.uid,
        subject: msg.envelope?.subject ?? "(no subject)",
        to: toAddresses, // Useful for sent folder to see who you sent it to
        date: msg.internalDate,
        flags: msg.flags,
        body: {
          text: parsed?.text ?? "",
          html: parsed?.html ?? parsed?.textAsHtml ?? "",
        },
      });
    }

    // 9. Cleanup connection
    await client.logout();

    // 10. Response
    return NextResponse.json({
      mailbox: mailbox.email,
      folder: sentFolderName,
      count: emails.length,
      emails,
    });

  } catch (err) {
    console.error("EMAIL_SENT_RETRIEVE_ERROR:", err);

    return NextResponse.json(
      { error: "Failed to fetch sent emails" },
      { status: 500 }
    );
  }
}