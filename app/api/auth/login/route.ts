// ─── Inside route.ts ──────────────────────────────────────────────────────────
import { encode } from "next-auth/jwt";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
// 1. IMPORT your session creator helper directly from auth.ts
import { createNewSession } from "@/lib/auth"; 

export const runtime = "nodejs";

const AUTH_JWT_SALT = "authjs.session-token";
const LOG_PREFIX = "[entra-login]";

function log(message: string, data?: unknown) {
  if (data !== undefined) {
    console.log(`${LOG_PREFIX} ${message}`, JSON.stringify(data, null, 2));
  } else {
    console.log(`${LOG_PREFIX} ${message}`);
  }
}

function logError(message: string, error: unknown) {
  console.error(`${LOG_PREFIX} ERROR — ${message}`, error);
}

function normalizeLoginValue(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createLoginError(message: string, status: number) {
  log(`Returning error response: ${message} (HTTP ${status})`);
  return Response.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  log("POST /api/entra-login called");

  if (!process.env.AUTH_SECRET) {
    logError("AUTH_SECRET is not set in environment", null);
    return createLoginError("Authentication is not configured", 500);
  }

  let body: unknown;
  try {
    body = await request.json();
    log("Request body parsed successfully");
  } catch (err) {
    logError("Failed to parse request JSON body", err);
    return createLoginError("Invalid JSON body", 400);
  }

  const identifier = normalizeLoginValue(
    typeof body === "object" && body !== null
      ? (body as { username?: unknown; email?: unknown }).username ??
          (body as { username?: unknown; email?: unknown }).email
      : undefined,
  );
  const password =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  log(`Resolved identifier: "${identifier}", password provided: ${!!password}`);

  if (!identifier || !password) {
    return createLoginError("username/email and password are required", 400);
  }

  log(`Looking up user in database for identifier: "${identifier}"`);
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

  if (!user) {
    log(`No user found for identifier: "${identifier}"`);
    return createLoginError("Invalid username/email or password", 401);
  }

  if (!user.isActive) {
    log(`User ${user.id} is inactive — rejecting login`);
    return createLoginError("Invalid username/email or password", 401);
  }

  log(`Verifying password for user: ${user.id}`);
  const passwordMatches = verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    return createLoginError("Invalid username/email or password", 401);
  }

  log(`Updating lastLoggedIn for user: ${user.id}`);
  await prisma.appUsers.update({
    where: { id: user.id },
    data: { lastLoggedIn: new Date() },
  });

  // 2. NEW: GENERATE TRACKED DATABASE SESSION RECORD
  log(`Creating physical database session tracking row for mobile device...`);
  let sessionDetails;
  try {
    sessionDetails = await createNewSession(user.id);
    log(`Session successfully saved in DB: ${sessionDetails.sessionId}`);
  } catch (sessionErr) {
    logError("Failed to create user session record in database", sessionErr);
    return createLoginError("Could not initialize your active user session", 500);
  }

  log(`Encoding JWT token for user: ${user.id}`);
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
      
      // 3. ATTACH THE EXPECTED METADATA TO PREVENT BLANK TOKEN INVALIDATION
      sessionId: sessionDetails.sessionId,
      cookieVersion: sessionDetails.cookieVersion,
      lastVerified: sessionDetails.lastVerified,
    },
  });
  log("JWT token encoded successfully with session tracking variables attached.");

  // ==========================================
  // MOBILE PUSH NOTIFICATION ON WEB LOGIN
  // ==========================================
  log(`Querying device tokens for user: ${user.id}`);
  try {
    const userDevices = await prisma.deviceToken.findMany({
      where: { userId: user.id },
    });

    if (userDevices.length > 0) {
      let admin = (await import("@/lib/firebaseAdmin")).default;
      const notificationPayload = {
        notification: {
          title: "New Mobile Login",
          body: "Your account was just accessed via the mobile client.",
        },
      };

      await Promise.allSettled(
        userDevices.map(async (device) => {
          return admin.messaging().send({
            token: device.token,
            ...notificationPayload,
          });
        }),
      );
    }
  } catch (fcmError) {
    logError("Notification pipeline threw an unexpected error", fcmError);
  }

  log(`Login successful for user ${user.id} — returning token and profile`);
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