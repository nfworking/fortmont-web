import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { addMinutes } from 'date-fns';
import {
  generateRandomString,
  scopesInclude,
  signAccessToken,
  signIdToken,
  verifyClientSecret,
} from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

function scopesFromJson(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

async function buildIdTokenClaims(userId: string, scopes: string[]) {
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
  return claims;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const grantType = form.get('grant_type');
  const clientId = form.get('client_id') as string | null;
  const clientSecret = form.get('client_secret') as string | null;
  const code = form.get('code') as string | null;
  const redirectUri = form.get('redirect_uri') as string | null;
  const refreshToken = form.get('refresh_token') as string | null;
  const codeVerifier = form.get('code_verifier') as string | null;

  if (!clientId) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 });
  }

  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  if (!client) return NextResponse.json({ error: 'invalid_client' }, { status: 400 });

  if (clientSecret) {
    const ok = await verifyClientSecret(client.clientSecret, clientSecret);
    if (!ok) return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  if (grantType === 'authorization_code') {
    if (!code || !redirectUri) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const authCode = await prisma.oAuthCode.findUnique({ where: { code } });
    if (!authCode || authCode.used || authCode.expiresAt < new Date()) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }
    if (authCode.clientId !== client.id || authCode.redirectUri !== redirectUri) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    if (authCode.codeChallenge) {
      if (!codeVerifier) {
        return NextResponse.json(
          { error: 'invalid_request', error_description: 'code_verifier required' },
          { status: 400 },
        );
      }
      const verifierHash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      if (verifierHash !== authCode.codeChallenge) {
        return NextResponse.json(
          { error: 'invalid_grant', error_description: 'PKCE verification failed' },
          { status: 400 },
        );
      }
    }

    await prisma.oAuthCode.update({ where: { code }, data: { used: true } });

    const scopes = scopesFromJson(authCode.scopes);
    const scopeString = scopes.join(' ');
    const accessToken = await signAccessToken(
      { sub: authCode.userId, aud: client.clientId, scope: scopeString },
      '1h',
    );

    let refreshTokenValue: string | undefined;
    if (scopesInclude(scopes, 'offline_access')) {
      refreshTokenValue = await generateRandomString(48);
      await prisma.oAuthToken.create({
        data: {
          token: refreshTokenValue,
          clientId: client.id,
          userId: authCode.userId,
          type: 'REFRESH',
          scopes,
          expiresAt: addMinutes(new Date(), 60 * 24 * 30),
        },
      });
    }

    const resp: Record<string, unknown> = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: scopeString,
    };

    if (scopesInclude(scopes, 'openid')) {
      const idTokenClaims = await buildIdTokenClaims(authCode.userId, scopes);
      resp.id_token = await signIdToken(idTokenClaims, client.clientId, '1h');
    }

    if (refreshTokenValue) resp.refresh_token = refreshTokenValue;
    return NextResponse.json(resp);
  }

  if (grantType === 'refresh_token') {
    if (!refreshToken) return NextResponse.json({ error: 'invalid_request' }, { status: 400 });

    const stored = await prisma.oAuthToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date() || stored.clientId !== client.id) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    const scopes = scopesFromJson(stored.scopes);
    const scopeString = scopes.join(' ');
    const accessToken = await signAccessToken(
      { sub: stored.userId, aud: client.clientId, scope: scopeString },
      '1h',
    );

    const resp: Record<string, unknown> = {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: scopeString,
    };

    if (scopesInclude(scopes, 'openid')) {
      const idTokenClaims = await buildIdTokenClaims(stored.userId, scopes);
      resp.id_token = await signIdToken(idTokenClaims, client.clientId, '1h');
    }

    return NextResponse.json(resp);
  }

  return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
}
