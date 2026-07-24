import "server-only";
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { verifyTwoFactorCode } from "@/lib/two-factor";
import { headers } from "next/headers";
import crypto from "crypto";


const LOG_PREFIX = "[auth.ts]";
function log(msg: string, data?: unknown) {
  console.log(`${LOG_PREFIX} ${msg}`, data !== undefined ? JSON.stringify(data, null, 2) : "");
}
function logError(msg: string, err: unknown) {
  console.error(`${LOG_PREFIX} ERROR — ${msg}`, err);
}

// ─── Shared notification helper ───────────────────────────────────────────────

async function sendLoginNotification(userId: string, provider: "credentials" | "entra") {
  log(`sendLoginNotification called — userId: ${userId}, provider: ${provider}`);
  try {
    const userDevices = await prisma.deviceToken.findMany({
      where: { userId },
    });

    log(`Device tokens found for user ${userId}: ${userDevices.length}`, {
      tokens: userDevices.map((d) => ({ id: d.id, preview: d.token.slice(0, 20) + "..." })),
    });

    if (userDevices.length === 0) {
      log(`No device tokens for user ${userId} — skipping push notification`);
      return;
    }

    log("Importing Firebase Admin SDK...");
    let admin: Awaited<typeof import("@/lib/firebaseAdmin")>["default"];
    try {
      admin = (await import("@/lib/firebaseAdmin")).default;
      log("Firebase Admin SDK imported successfully");
    } catch (importErr) {
      logError("Failed to import Firebase Admin SDK", importErr);
      return;
    }
    const user = await prisma.appUsers.findUnique({ where: { id: userId } });
    if (!user) {
      log(`User not found for ID ${userId} — cannot send notification`);
      return;
    }
    const providerLabel = provider === "entra" ? "Microsoft Entra" : "username and password";
    const payload = {
      notification: {
        title: "New Login",
        body: `Your account ${user.username} was just signed in via ${providerLabel}.`,
      },
      android: {
        priority: "high" as const ,
      },
    };
    log("FCM payload:", payload);

    const results = await Promise.allSettled(
      userDevices.map(async (device) => {
        log(`Sending to device ${device.id} (${device.token.slice(0, 20)}...)`);
        const messageId = await admin.messaging().send({
          token: device.token,
          ...payload,
        });
        log(`Success — device ${device.id}, messageId: ${messageId}`);
        return messageId;
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    log(`Notification dispatch complete — ${succeeded} succeeded, ${failed} failed`);
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        logError(`Device index ${i} rejected`, r.reason);
      }
    });
  } catch (err) {
    logError(`sendLoginNotification threw unexpectedly for user ${userId}`, err);
  }
}

async function updateLastLogin(userId: string) {
  try {
    await prisma.appUsers.update({
      where: { id: userId },
      data: {
        lastLoggedIn: new Date(),
      },
    });

    log(`Updated lastLoggedIn for user ${userId}`);
  } catch (err) {
    logError(`Failed to update lastLoggedIn for user ${userId}`, err);
  }
}

async function loadCurrentAppUser(userId: string) {
  return prisma.appUsers.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      role: true,
      phone: true,
      avatarUrl: true,
      isActive: true,
      isEntraUser: true,
      onboarded: true,
    },
  });
}

function applyUserClaimsToToken(
  token: Record<string, unknown>,
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string | null;
    role: string | null;
    phone: string | null;
    avatarUrl: string | null;
    isActive: boolean;
    isEntraUser: boolean | null;
    onboarded: boolean | null;
  },
) {
  token.sub = user.id;
  token.name = user.displayName ?? user.username;
  token.email = user.email ?? undefined;
  token.username = user.username;
  token.role = user.role;
  token.phone = user.phone;
  token.avatarUrl = user.avatarUrl;
  token.isActive = user.isActive;
  token.isEntraUser = user.isEntraUser;
  token.isOnboarded = user.onboarded;
}

// ─── Entra profile sync ────────────────────────────────────────────────────────

function normalizeNullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function pickEntraValue(...values: unknown[]) {
  for (const value of values) {
    const normalized = normalizeNullableString(value);
    if (typeof normalized === "string") return normalized;
  }
  return undefined;
}

async function syncEntraUser(profile: Record<string, unknown> | undefined) {
  const email = pickEntraValue(
    profile?.email,
    profile?.preferred_username,
    profile?.upn,
  )?.toLowerCase();

  const username = pickEntraValue(
    profile?.preferred_username,
    profile?.upn,
    profile?.email,
    profile?.name,
  )?.toLowerCase();

  const displayName = pickEntraValue(profile?.name, profile?.given_name, profile?.family_name);
  const avatarUrl = pickEntraValue(profile?.picture, profile?.avatarUrl, profile?.image);

  if (!email && !username) return null;

  const existingUser = await prisma.appUsers.findFirst({
    where: {
      OR: [
        ...(email ? [{ email }] : []),
        ...(username ? [{ username }] : []),
      ],
    },
  });

  if (existingUser) {
    return prisma.appUsers.update({
      where: { id: existingUser.id },
      data: {
        displayName: displayName ?? existingUser.displayName,
        email: email ?? existingUser.email,
        username: username ?? existingUser.username,
        avatarUrl: avatarUrl ?? existingUser.avatarUrl,
        isEntraUser: true,
        isActive: true,
      },
    });
  }

  return prisma.appUsers.create({
    data: {
      username: username ?? email?.split("@")[0] ?? "entra-user",
      displayName: displayName ?? null,
      email: email ?? null,
      avatarUrl: avatarUrl ?? null,
      passwordHash: "",
      isActive: true,
      isEntraUser: true,
    },
  });
}

// ─── Custom Session Helper ───────────────────────────────────────────────────

// ─── Inside auth.ts ───────────────────────────────────────────────────────────

// Add the 'export' keyword here:
export async function createNewSession(userId: string) {
  const COOKIE_VERSION = parseInt(process.env.COOKIE_VERSION || "1", 10);
  let userAgent: string | null = null;
  let ipAddress: string | null = null;
  let signInUrl: string | null = null;
  try {
    const userHeaders = await headers();
    userAgent = userHeaders.get("user-agent") || null;
    ipAddress = userHeaders.get("x-forwarded-for")?.split(",")[0].trim() || userHeaders.get("x-real-ip") || null;

    const referer = userHeaders.get("referer");
    const origin = userHeaders.get("origin");
    const forwardedHost = userHeaders.get("x-forwarded-host");
    const host = forwardedHost || userHeaders.get("host");
    const forwardedProto = userHeaders.get("x-forwarded-proto");
    const proto = forwardedProto || "https";
    signInUrl = referer || origin || (host ? `${proto}://${host}` : null);
  } catch {
    log("Could not read headers during session creation (expected outside request lifecycle)");
  }

  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const sessionRecord = await prisma.userSession.create({
    data: {
      userId,
      sessionToken,
      userAgent,
      ipAddress,
      signInUrl,
      cookieVersion: COOKIE_VERSION,
      expiresAt,
    },
  });

  return {
    sessionId: sessionRecord.sessionToken,
    cookieVersion: COOKIE_VERSION,
    lastVerified: Date.now(),
  };
}

export async function revokeUserSessions(userId: string, keepSessionToken?: string) {
  await prisma.userSession.deleteMany({
    where: {
      userId,
      ...(keepSessionToken ? { NOT: { sessionToken: keepSessionToken } } : {}),
    },
  });
}
// ─── NextAuth config ───────────────────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Username and password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        otpCode: { label: "Verification code", type: "text" },
      },
      async authorize(credentials) {
        log("Credentials authorize() called");
        const username =
          typeof credentials?.username === "string"
            ? credentials.username.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        const otpCode =
          typeof credentials?.otpCode === "string" ? credentials.otpCode : "";

        log(`Attempting credentials login for username: "${username}"`);

        if (!username || !password) {
          log("Missing username or password — returning null");
          return null;
        }

        const appUser = await prisma.appUsers.findUnique({ where: { username } });
        log(`DB lookup result: ${appUser ? `found id=${appUser.id}, isActive=${appUser.isActive}` : "not found"}`);

        if (!appUser || !appUser.isActive) return null;
        if (!verifyPassword(password, appUser.passwordHash)) {
          log(`Password verification failed for user ${appUser.id}`);
          return null;
        }

        if (appUser.twoFactorEnabled) {
          const isOtpValid = await verifyTwoFactorCode(appUser.id, otpCode);
          if (!isOtpValid) {
            log(`Two-factor verification failed for user ${appUser.id}`);
            return null;
          }
        }

        log(`Credentials login successful for user ${appUser.id} — firing notification`);
        sendLoginNotification(appUser.id, "credentials").catch((err) =>
          logError("Background notification failed (credentials)", err),
        );

        return {
          id: appUser.id,
          name: appUser.displayName ?? appUser.username,
          email: appUser.email,
        };
      },
    }),
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "microsoft-entra-id") {
        log(`JWT callback — Entra login, syncing profile`);
        const syncedUser = await syncEntraUser(profile as Record<string, unknown> | undefined);
        log(`Entra sync result: ${syncedUser ? `id=${syncedUser.id}` : "null"}`);

        if (syncedUser) { 
          updateLastLogin(syncedUser.id).catch((err) =>
            logError("Failed updating last login (entra)", err),
          );
          applyUserClaimsToToken(token, syncedUser);

          // Register user session
          try {
            const sessionDetails = await createNewSession(syncedUser.id);
            token.sessionId = sessionDetails.sessionId;
            token.cookieVersion = sessionDetails.cookieVersion;
            token.lastVerified = sessionDetails.lastVerified;
            log(`Created new session ${sessionDetails.sessionId} for Entra login`);
          } catch (err) {
            logError("Failed to register session for Entra user during login", err);
          }

          log(`Entra login complete for user ${syncedUser.id} — firing notification`);
          sendLoginNotification(syncedUser.id, "entra").catch((err) =>
            logError("Background notification failed (entra)", err),
          );
        }

        return token;
      }

      if (user?.id) {
        log(`JWT callback — credentials login, enriching token for user ${user.id}`);
        const appUser = await prisma.appUsers.findUnique({ where: { id: user.id } });

        if (appUser) {
          updateLastLogin(appUser.id).catch((err) =>
            logError("Failed updating last login (credentials)", err),
          );
          applyUserClaimsToToken(token, appUser);

          // Register user session
          try {
            const sessionDetails = await createNewSession(appUser.id);
            token.sessionId = sessionDetails.sessionId;
            token.cookieVersion = sessionDetails.cookieVersion;
            token.lastVerified = sessionDetails.lastVerified;
            log(`Created new session ${sessionDetails.sessionId} for credentials login`);
          } catch (err) {
            logError("Failed to register session for credentials user during login", err);
          }
        }
      }

      // Subsequent verification flow
      if (!user && token.sub) {
        const COOKIE_VERSION = parseInt(process.env.COOKIE_VERSION || "1", 10);
        
        // 1. Check if token lacks session tracking or cookie version details
        const tokenVersion = token.cookieVersion as number | undefined;
        const sessionId = token.sessionId as string | undefined;
        
        const isOutdated = tokenVersion === undefined ? COOKIE_VERSION > 1 : tokenVersion !== COOKIE_VERSION;
        
        if (isOutdated) {
          log(`Session version mismatch for user ${token.sub} (Token: ${tokenVersion}, Server: ${COOKIE_VERSION})`);
          token.sub = undefined;
          token.error = "InvalidCookieVersion";
          return token;
        }
        
        // 2. Migration path: If version matches but we don't have a sessionId (e.g. initial launch of version 1)
        if (!sessionId) {
          log(`Migrating old token without sessionId for user ${token.sub}`);
          try {
            const sessionDetails = await createNewSession(token.sub as string);
            token.sessionId = sessionDetails.sessionId;
            token.cookieVersion = sessionDetails.cookieVersion;
            token.lastVerified = sessionDetails.lastVerified;
          } catch (err) {
            logError("Failed migrating old token to new session tracking", err);
            // Don't invalidate yet to prevent breaking user session if DB write fails temporarily
          }
        } else {
          // 3. Database check (checked on every request for immediate session revocation support)
          log(`Checking session ${sessionId} in DB for user ${token.sub}`);
          try {
            const activeSession = await prisma.userSession.findUnique({
            where: { sessionToken: sessionId },
          });

          if (!activeSession || activeSession.expiresAt < new Date()) {
            log(`Session ${sessionId} is revoked or expired`);
            // Invalidate the session by returning null, which will cause auth() to return null.
            return null as unknown as typeof token;
          }  if (Date.now() - activeSession.lastActive.getTime() > 5 * 60 * 1000) {
              await prisma.userSession.update({
                where: { id: activeSession.id },
                data: { lastActive: new Date() },
              }).catch((err) => logError("Failed to update lastActive", err));
            }

            const currentUser = await loadCurrentAppUser(token.sub as string);
            if (!currentUser || !currentUser.isActive) {
              log(`User ${token.sub} is inactive or missing during token refresh`);
              token.sub = undefined;
              token.error = "UserInactive";
              return token;
            }

            applyUserClaimsToToken(token, currentUser);
          } catch (err) {
            logError("Failed to query user session from database", err);
            // Fail-secure or fail-open? In a typical app, we fail-open (allow the request)
            // to prevent temporary DB glitches from logging everyone out.
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (!token.sub || token.error) {
        log(`Session callback — session is invalid due to token.error: ${token.error}`);
        return null as unknown as typeof session;
      }

      // Check database to ensure session has not been revoked (runs on every server-side auth() call)
      const sessionId = token.sessionId as string | undefined;
      if (sessionId) {
        try {
          const activeSession = await prisma.userSession.findUnique({
            where: { sessionToken: sessionId },
          });

          if (!activeSession || activeSession.expiresAt < new Date()) {
            log(`Session callback — Session ${sessionId} is revoked or expired in DB`);
            return null as unknown as typeof session;
          }

          // Throttle lastActive update to every 5 minutes
          if (Date.now() - activeSession.lastActive.getTime() > 5 * 60 * 1000) {
            await prisma.userSession.update({
              where: { id: activeSession.id },
              data: { lastActive: new Date() },
            }).catch((err) => logError("Failed to update lastActive in session callback", err));
          }
        } catch (err) {
          logError("Failed to query user session in session callback", err);
          // Fail-open for temporary database issues
        }
      }

      if (session.user) {
        const enrichedUser = session.user as unknown as Record<string, unknown>; 

        // Always copy strings safely if they exist
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        
        if (token.avatarUrl) {
          session.user.image = token.avatarUrl as string;
          enrichedUser.avatarUrl = token.avatarUrl;
        }

        // Direct property verification instead of strict "typeof === string" guard checks
        if (token.sub) enrichedUser.id = token.sub;
        if (token.username) enrichedUser.username = token.username;
        if (token.role) enrichedUser.role = token.role; // Fixed: Will no longer drop role enums/custom types
        if (token.phone) enrichedUser.phone = token.phone;
        if (token.isActive !== undefined) enrichedUser.isActive = token.isActive;
        if (token.isEntraUser !== undefined) enrichedUser.isEntraUser = token.isEntraUser;
        if (token.isOnboarded !== undefined) enrichedUser.isOnboarded = token.isOnboarded;

        // Pass sessionId to client side so we know which session is current
        if (token.sessionId) enrichedUser.sessionId = token.sessionId;
      }

      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sessionId) {
        log(`Deleting session ${message.token.sessionId} on sign out`);
        try {
          await prisma.userSession.delete({
            where: { sessionToken: message.token.sessionId as string },
          });
        } catch (err) {
          logError("Failed to delete session on sign out", err);
        }
      }
    }
  }
});
