import "server-only";
import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

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

// ─── NextAuth config ───────────────────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Username and password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        log("Credentials authorize() called");
        const username =
          typeof credentials?.username === "string"
            ? credentials.username.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

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

        log(`Credentials login successful for user ${appUser.id} — firing notification`);
        // Don't await — don't block the login response
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
          token.sub = syncedUser.id;
          token.name = syncedUser.displayName ?? syncedUser.username;
          token.email = syncedUser.email ?? token.email;
          token.username = syncedUser.username;
          token.role = syncedUser.role;
          token.phone = syncedUser.phone;
          token.avatarUrl = syncedUser.avatarUrl;
          token.isActive = syncedUser.isActive;
          token.isEntraUser = syncedUser.isEntraUser;
          token.isOnboarded = syncedUser.onboarded;

          log(`Entra login complete for user ${syncedUser.id} — firing notification`);
          // Don't await — don't block the login response
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

    token.sub = appUser.id;
    token.name = appUser.displayName ?? appUser.username;
    token.email = appUser.email ?? token.email;
    token.username = appUser.username;
    token.role = appUser.role;
    token.phone = appUser.phone;
    token.avatarUrl = appUser.avatarUrl;
    token.isActive = appUser.isActive;
    token.isEntraUser = appUser.isEntraUser;
    token.isOnboarded = appUser.onboarded;
  }
}

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const enrichedUser = session.user as typeof session.user & {
          id?: string;
          username?: string;
          role?: string | null;
          phone?: string | null;
          avatarUrl?: string | null;
          isActive?: boolean;
          isEntraUser?: boolean | null;
          isOnboarded?: boolean;
        };

        if (typeof token.name === "string") session.user.name = token.name;
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.avatarUrl === "string") {
          session.user.image = token.avatarUrl;
          enrichedUser.avatarUrl = token.avatarUrl;
        }
        if (typeof token.sub === "string") enrichedUser.id = token.sub;
        if (typeof token.username === "string") enrichedUser.username = token.username;
        if (typeof token.role === "string") enrichedUser.role = token.role;
        if (typeof token.phone === "string") enrichedUser.phone = token.phone;
        if (typeof token.isActive === "boolean") enrichedUser.isActive = token.isActive;
        if (typeof token.isEntraUser === "boolean") enrichedUser.isEntraUser = token.isEntraUser;
        if (typeof token.isOnboarded === "boolean") enrichedUser.isOnboarded = token.isOnboarded;
      }

      return session;
    },
  },
});