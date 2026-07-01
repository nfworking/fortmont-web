import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendEmail } from "@/lib/email"; // your email helper
import { z } from "zod";

const requestResetSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = requestResetSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "email is required" }, { status: 400 });
  }

  const { email } = parsed.data;

  const user = await prisma.appUsers.findUnique({
    where: { email },
  });

  // Always return success (prevents email enumeration)
  if (!user) {
    return Response.json({ ok: true });
  }

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min
    },
  });

  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email!,
    subject: "Reset your password",
    html: `
      <p>Click below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 30 minutes.</p>
    `,
  });

  return Response.json({ ok: true });
}