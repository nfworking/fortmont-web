import { encode } from "next-auth/jwt";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export const runtime = "nodejs";

const AUTH_JWT_SALT = "authjs.session-token";

function normalizeLoginValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createLoginError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!process.env.AUTH_SECRET) {
    return createLoginError("Authentication is not configured", 500);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createLoginError("Invalid JSON body", 400);
  }

  const identifier = normalizeLoginValue(
    typeof body === "object" && body !== null
      ? (body as { username?: unknown; email?: unknown }).username ??
          (body as { username?: unknown; email?: unknown }).email
      : undefined,
  );
  const password =
    typeof body === "object" && body !== null && typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!identifier || !password) {
    return createLoginError("username/email and password are required", 400);
  }

  const user = await prisma.appUsers.findFirst({
    where: {
      OR: [{ username: identifier }, { email: identifier }],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      passwordHash: true,
      isActive: true,
      role: true,
      phone: true,
      avatarUrl: true,
    },
  });

  if (!user || !user.isActive) {
    return createLoginError("Invalid username/email or password", 401);
  }

  const passwordMatches = verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return createLoginError("Invalid username/email or password", 401);
  }

  const token = await encode({
    secret: process.env.AUTH_SECRET,
    salt: AUTH_JWT_SALT,
    token: {
      sub: user.id,
      email: user.email,
      name: user.displayName ?? user.username,
      username: user.username,
      isActive: user.isActive,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    },
  });

  return Response.json(
    {
      token,
      tokenType: "Bearer",
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        isActive: user.isActive,
        role: user.role,
        phone: user.phone,
        avatarUrl: user.avatarUrl,

      },
    },
    { status: 200 },
  );
}