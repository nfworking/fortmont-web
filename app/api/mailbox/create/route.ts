import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/mailboxPassword";
import { ImapFlow } from "imapflow";
import nodemailer from "nodemailer"
import { resolveTicketingActor } from "@/lib/ticketing-auth";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseEmailAddress(email: string) {
  const [local_part, domain] = email.split("@");
  if (!local_part || !domain) {
    return null;
  }
  return { local_part, domain };
}

export async function POST(req: Request) {
  const actor = await resolveTicketingActor(req);

  if (!actor?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = actor.userId;
  const name = `user-${userId}`;
  const { email, password } = await req.json();
  const mailboxApi = process.env.MAILBOX_API;
  const mailcowApiToken = process.env.MAILCOW_API_TOKEN;
  const imapHost = process.env.IMAP_HOST;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Missing email or password" },
      { status: 400 }
    );
  }

  if (!mailboxApi || !mailcowApiToken || !imapHost) {
    return NextResponse.json(
      { error: "Mailbox service is not configured" },
      { status: 500 }
    );
  }

  const parsedEmail = parseEmailAddress(email);
  if (!parsedEmail) {
    return NextResponse.json(
      { error: "Invalid email format" },
      { status: 400 }
    );
  }

  // prevent duplicates
  const existing = await prisma.userMailbox.findFirst({
    where: { userId, email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Mailbox already exists" },
      { status: 409 }
    );
  }

  /**
   * 1. CREATE mailbox on mail server (MISSING IN YOUR CURRENT CODE)
   */
  try {
    const mailcowResponse = await fetch(`${mailboxApi}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": mailcowApiToken,
      },
      body: JSON.stringify({
        local_part: parsedEmail.local_part,
        domain: parsedEmail.domain,
        name: name,
        quota: 1000, // default to 1000MB if not set
        password: password,
        password2: password,
        active: "1",
        force_pw_update: "1",
        tls_enforce_in: "1",
        tls_enforce_out: "1",
      }),
    });

    const rawBody = await mailcowResponse.text();
    let parsedBody: unknown = rawBody;

    try {
      parsedBody = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      // Keep raw text body for troubleshooting non-JSON API responses.
    }

    const mailcowHasAppError = Array.isArray(parsedBody)
      ? parsedBody.some((item: any) => {
          const type = String(item?.type ?? "").toLowerCase();
          return type === "error" || type === "danger";
        })
      : false;

    if (!mailcowResponse.ok || mailcowHasAppError) {
      return NextResponse.json(
        {
          error: "Failed to create mailbox on mail server",
          status: mailcowResponse.status,
          mailcowResponse: parsedBody,
        },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create mailbox on mail server", errorDetails: (err as Error).message },
      { status: 500 }
    );
  }

  /**
   * 2. VERIFY IMAP (optional safety check)
   */
  try {
    let connected = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const client = new ImapFlow({
        host: imapHost,
        port: 993,
        secure: true,
        auth: { user: email, pass: password },
      });

      try {
        await client.connect();
        await client.logout();
        connected = true;
        break;
      } catch {
        if (attempt < 3) {
          await wait(1500);
        }
      }
    }

    if (!connected) {
      return NextResponse.json(
        { error: "Mailbox created but IMAP login failed" },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: "Mailbox created but IMAP login failed", errorDetails: (err as Error).message },
      { status: 502 }
    );
  }

  /**
   * 3. STORE in DB
   */
  const mailbox = await prisma.userMailbox.create({
    data: {
      userId,
      email,
      encryptedPassword: encrypt(password),
    },
  });

  const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST!, 
        port: 465, 
        secure: true, 
        auth: {
          user: process.env.SYSTEM_SMTP_USER!,
          pass: process.env.SYSTEM_SMTP_PASS!,
        },
      });

  const senderHeader = `"Fortmont Identity Services" <${process.env.SYSTEM_SMTP_USER!}>`;

    // 5. Send the email via SMTP
  const info = await transporter.sendMail({
      from: senderHeader,
      to: mailbox.email,
      subject: "Welcome to Fortmont!",
      text: `You mailbox has been successfully created for your Fortmont account, ${mailbox.email}!`
      
    });

  // Send invitation email
  

  return NextResponse.json({
    success: true,
    mailbox: {
      id: mailbox.id,
      email: mailbox.email,
    },
  });
}