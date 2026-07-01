import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return new Response("Invalid or missing token/password", { status: 400 });
  }

  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record || record.expiresAt < new Date()) {
    return new Response("Invalid or expired token", { status: 400 });
  }

  const hashed = hashPassword(password);

  await prisma.$transaction([
    prisma.appUsers.update({
      where: { id: record.userId },
      data: { passwordHash: hashed },
    }),
    prisma.passwordResetToken.delete({
      where: { token },
    }),
    prisma.userSession.deleteMany({
      where: { userId: record.userId },
    }),
  ]);

  return Response.json({ ok: true });
}