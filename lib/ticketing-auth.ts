import { decode } from 'next-auth/jwt';
import { auth } from '@/lib/auth';
import { getOAuthBaseUrl, verifyAccessToken } from '@/lib/oauth';
import { prisma } from '@/lib/prisma';
import { verifyStreamToken } from '@/lib/stream-token';

const LEGACY_AUTH_JWT_SALT = 'authjs.session-token';

export type TicketingActor = {
  userId: string;
  userRole: string | null;
};

async function getUserRole(userId: string): Promise<string | null> {
  const user = await prisma.appUsers.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  return user?.role ?? null;
}

async function tryOAuthAccessToken(request: Request): Promise<TicketingActor | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const issuer = getOAuthBaseUrl(request);
    const { payload } = await verifyAccessToken(authHeader.slice(7), issuer);
    if (typeof payload.sub !== 'string') {
      return null;
    }

    return {
      userId: payload.sub,
      userRole: await getUserRole(payload.sub),
    };
  } catch {
    return null;
  }
}

async function tryLegacyBearerToken(request: Request): Promise<TicketingActor | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return null;
  }

  try {
    const decoded = await decode({
      token: authHeader.slice(7),
      secret: authSecret,
      salt: LEGACY_AUTH_JWT_SALT,
    });

    if (!decoded?.sub) {
      return null;
    }

    return {
      userId: decoded.sub,
      userRole: (decoded as { role?: string }).role ?? (await getUserRole(decoded.sub)),
    };
  } catch {
    return null;
  }
}

// Handles EventSource (SSE) connections, which can't set custom headers.
// Only accepts short-lived tokens scoped to "notifications-stream" via
// mintStreamToken — never a general-purpose access token — so a leaked
// URL (logs, browser history) exposes at most a 60-second, single-purpose
// credential rather than the user's full session.
async function tryStreamToken(request: Request): Promise<TicketingActor | null> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return null;
  }

  const result = await verifyStreamToken(token);
  if (!result) {
    return null;
  }

  return {
    userId: result.userId,
    userRole: result.role ?? (await getUserRole(result.userId)),
  };
}

async function tryCookieSession(): Promise<TicketingActor | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
    userRole:
      (session.user as { role?: string | null }).role ?? (await getUserRole(session.user.id)),
  };
}

export async function resolveTicketingActor(request: Request): Promise<TicketingActor | null> {
  return (
    (await tryOAuthAccessToken(request)) ||
    (await tryLegacyBearerToken(request)) ||
    (await tryStreamToken(request)) ||
    (await tryCookieSession())
  );
}