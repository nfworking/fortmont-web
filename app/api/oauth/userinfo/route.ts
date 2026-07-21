import { NextResponse } from 'next/server';
import { scopesInclude, verifyAccessToken } from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

function scopesFromPayload(scope: unknown): string[] {
  return typeof scope === 'string' ? scope.split(/\s+/).filter(Boolean) : [];
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  try {
    const { payload } = await verifyAccessToken(authHeader.slice(7));
    const userId = payload.sub;
    if (typeof userId !== 'string') {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
    }

    const scopes = scopesFromPayload(payload.scope);
    const user = await prisma.appUsers.findUnique({
      where: { id: userId },
      select: { email: true, displayName: true, username: true, avatarUrl: true },
    });

    const claims: Record<string, unknown> = { sub: userId };
    if (scopesInclude(scopes, 'email') && user?.email) {
      claims.email = user.email;
    }
    if (scopesInclude(scopes, 'profile')) {
      claims.name = user?.displayName ?? user?.username ?? undefined;
      if (user?.avatarUrl) claims.picture = user.avatarUrl;
    }

    return NextResponse.json(claims);
  } catch {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }
}
