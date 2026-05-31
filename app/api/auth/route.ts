import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function normalizeEmail(value: unknown): string | null | undefined {
  const normalized = normalizeNullableString(value);

  if (typeof normalized === "string") {
    return normalized.toLowerCase();
  }

  return normalized;
}

function createError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function PATCH(request: NextRequest) {
  if (!process.env.AUTH_SECRET) {
    return createError("Authentication is not configured", 500);
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  if (!token?.sub) {
    return createError("Unauthorized", 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createError("Invalid JSON body", 400);
  }

  if (!body || typeof body !== "object") {
    return createError("Request body must be an object", 400);
  }

  const requestedUserId = request.nextUrl.searchParams.get("id") ?? token.sub;
  const isAdmin = token.role === "admin";

  if (requestedUserId !== token.sub && !isAdmin) {
    return createError("Forbidden", 403);
  }

  const updates: {
    displayName?: string | null;
    email?: string | null;
    role?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  } = {};

  let hasUpdates = false;

  if (Object.prototype.hasOwnProperty.call(body, "displayName")) {
    const value = normalizeNullableString((body as { displayName?: unknown }).displayName);

    if (value === undefined) {
      return createError("displayName must be a string or null", 400);
    }

    updates.displayName = value;
    hasUpdates = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    const value = normalizeEmail((body as { email?: unknown }).email);

    if (value === undefined) {
      return createError("email must be a string or null", 400);
    }

    updates.email = value;
    hasUpdates = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    if (!isAdmin) {
      return createError("Only admins can update role", 403);
    }

    const value = normalizeNullableString((body as { role?: unknown }).role);

    if (value === undefined) {
      return createError("role must be a string or null", 400);
    }

    updates.role = value;
    hasUpdates = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    const value = normalizeNullableString((body as { phone?: unknown }).phone);

    if (value === undefined) {
      return createError("phone must be a string or null", 400);
    }

    updates.phone = value;
    hasUpdates = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "avatarUrl")) {
    const value = normalizeNullableString((body as { avatarUrl?: unknown }).avatarUrl);

    if (value === undefined) {
      return createError("avatarUrl must be a string or null", 400);
    }

    updates.avatarUrl = value;
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return createError("At least one field must be provided", 400);
  }

  const existingUser = await prisma.appUsers.findUnique({
    where: {
      id: requestedUserId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!existingUser) {
    return createError("User not found", 404);
  }

  if (typeof updates.email === "string" && updates.email !== existingUser.email) {
    const conflictingUser = await prisma.appUsers.findFirst({
      where: {
        email: updates.email,
        NOT: {
          id: requestedUserId,
        },
      },
      select: {
        id: true,
      },
    });

    if (conflictingUser) {
      return createError("A user with that email already exists", 409);
    }
  }

  const updatedUser = await prisma.appUsers.update({
    where: {
      id: requestedUserId,
    },
    data: updates,
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      isActive: true,
      role: true,
      phone: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return Response.json(updatedUser);
}