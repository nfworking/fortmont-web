import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value: unknown): string | null | undefined {
  const normalized = normalizeNullableString(value);
  if (typeof normalized === "string") return normalized.toLowerCase();
  return normalized;
}

function createError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function PATCH(request: NextRequest) {
  // 2. Try fetching the cookie session first, fall back to parsing the Bearer Token header
  let sessionUser = (await auth())?.user as { id?: string; role?: string } | undefined;

  if (!sessionUser) {
    const token = await getToken({ 
      req: request, 
      secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET 
    });
    
    if (token) {
      sessionUser = {
        id: token.sub, // NextAuth maps the user ID to the 'sub' field in JWTs
        role: (token.role as string) || "user",
      };
    }
  }

  if (sessionUser?.id) {
    const currentUser = await prisma.appUsers.findUnique({
      where: { id: sessionUser.id },
      select: { role: true, isActive: true },
    });

    if (!currentUser?.isActive) {
      return createError("Unauthorized", 401);
    }

    sessionUser.role = currentUser.role || sessionUser.role || "user";
  }

  if (!sessionUser || !sessionUser.id) {
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

  const requestedUserId = request.nextUrl.searchParams.get("id") ?? sessionUser.id;
  const isAdmin = sessionUser.role === "admin";

  if (requestedUserId !== sessionUser.id && !isAdmin) {
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
    if (value === undefined) return createError("displayName must be a string or null", 400);
    updates.displayName = value;
    hasUpdates = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    const value = normalizeEmail((body as { email?: unknown }).email);
    if (value === undefined) return createError("email must be a string or null", 400);
    updates.email = value;
    hasUpdates = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    if (!isAdmin) return createError("Only admins can update role", 403);
    const value = normalizeNullableString((body as { role?: unknown }).role);
    if (value === undefined) return createError("role must be a string or null", 400);
    updates.role = value;
    hasUpdates = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    const value = normalizeNullableString((body as { phone?: unknown }).phone);
    if (value === undefined) return createError("phone must be a string or null", 400);
    updates.phone = value;
    hasUpdates = true;
  }

  if (Object.prototype.hasOwnProperty.call(body, "avatarUrl")) {
    const value = normalizeNullableString((body as { avatarUrl?: unknown }).avatarUrl);
    if (value === undefined) return createError("avatarUrl must be a string or null", 400);
    updates.avatarUrl = value;
    hasUpdates = true;
  }

  if (!hasUpdates) {
    return createError("At least one field must be provided", 400);
  }

  const existingUser = await prisma.appUsers.findUnique({
    where: { id: requestedUserId },
    select: { id: true, email: true },
  });

  if (!existingUser) {
    return createError("User not found", 404);
  }

  if (typeof updates.email === "string" && updates.email !== existingUser.email) {
    const conflictingUser = await prisma.appUsers.findFirst({
      where: {
        email: updates.email,
        NOT: { id: requestedUserId },
      },
      select: { id: true },
    });

    if (conflictingUser) {
      return createError("A user with that email already exists", 409);
    }
  }

  const updatedUser = await prisma.appUsers.update({
    where: { id: requestedUserId },
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