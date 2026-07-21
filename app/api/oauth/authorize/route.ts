import { NextResponse } from 'next/server';
import { addMinutes } from 'date-fns';
import { auth } from '@/lib/auth';
import { generateRandomString, intersectScopes, parseScopeList } from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const responseType = url.searchParams.get('response_type');
  const scope = url.searchParams.get('scope') || '';
  const state = url.searchParams.get('state');
  const codeChallenge = url.searchParams.get('code_challenge');
  const consent = url.searchParams.get('consent');

  if (!clientId || !redirectUri || responseType !== 'code') {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  const redirectUris = (client?.redirectUris ?? []) as unknown as string[];
  if (!client || !redirectUris.includes(redirectUri)) {
    return NextResponse.json({ error: 'unauthorized_client' }, { status: 400 });
  }

  const allowedScopes = (client.scopes as unknown as string[]) ?? [];
  const requestedScopes = parseScopeList(scope);
  const grantedScopes =
    requestedScopes.length > 0 ? intersectScopes(requestedScopes, allowedScopes) : [...allowedScopes];

  const unknownScopes = requestedScopes.filter((value) => !allowedScopes.includes(value));
  if (unknownScopes.length > 0) {
    return NextResponse.json(
      { error: 'invalid_scope', error_description: `Unknown scopes: ${unknownScopes.join(', ')}` },
      { status: 400 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    const signInUrl = new URL('/api/auth/signin', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  if (consent !== 'approved') {
    const consentUrl = new URL('/oauth/consent', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    url.searchParams.forEach((value, key) => {
      consentUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(consentUrl);
  }

  const code = await generateRandomString(32);
  await prisma.oAuthCode.create({
    data: {
      code,
      clientId: client.id,
      userId: session.user.id,
      redirectUri,
      scopes: grantedScopes,
      codeChallenge: codeChallenge ?? undefined,
      expiresAt: addMinutes(new Date(), 5),
    },
  });

  const params = new URLSearchParams({ code, ...(state ? { state } : {}) });
  return NextResponse.redirect(`${redirectUri}?${params.toString()}`);
}
