import { NextResponse } from 'next/server';
import { addMinutes } from 'date-fns';
import {
  generateRandomString,
  scopesFromJson,
  scopesInclude,
  signAccessToken,
  signIdToken,
  verifyClientSecret,
  verifyPkceS256,
} from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

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

/**
 * Authenticate the client: either a valid client_secret, or PKCE for public clients.
 * At least one must succeed for authorization_code grants.
 */
async function authenticateClient(
  client: { id: string; clientSecret: string },
  clientSecret: string | null,
  authCode: { codeChallenge: string | null } | null,
  codeVerifier: string | null,
): Promise<{ ok: true } | { ok: false; status: number; body: Record<string, string> }> {
  let secretOk = false;
  if (clientSecret) {
    secretOk = await verifyClientSecret(client.clientSecret, clientSecret);
    if (!secretOk) {
      return {
        ok: false,
        status: 401,
        body: { error: 'invalid_client', error_description: 'Invalid client_secret' },
      };
    }
  }

  if (authCode?.codeChallenge) {
    if (!codeVerifier) {
      return {
        ok: false,
        status: 400,
        body: {
          error: 'invalid_request',
          error_description: 'code_verifier is required for PKCE',
        },
      };
    }
    if (!verifyPkceS256(codeVerifier, authCode.codeChallenge)) {
      return {
        ok: false,
        status: 400,
        body: {
          error: 'invalid_grant',
          error_description: 'PKCE verification failed',
        },
      };
    }
    return { ok: true };
  }

  // No PKCE on the code — require client_secret (confidential client)
  if (!secretOk) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'invalid_client',
        error_description:
          'client_secret is required unless the authorization request used PKCE (code_challenge)',
      },
    };
  }

  return { ok: true };
}

function corsHeaders(request: Request): HeadersInit {
  const allowed = (
    process.env.OAUTH_CORS_ORIGINS ||
    process.env.CORS_ALLOW_ORIGIN ||
    'http://localhost:8080'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (allowed.length === 1) {
    headers['Access-Control-Allow-Origin'] = allowed[0];
  }
  return headers;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
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

  const cors = corsHeaders(request);

  if (!clientId) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400, headers: cors });
  }

  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  if (!client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401, headers: cors });
  }

  if (grantType === 'authorization_code') {
    if (!code || !redirectUri) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          error_description: 'code and redirect_uri are required',
        },
        { status: 400, headers: cors },
      );
    }

    const authCode = await prisma.oAuthCode.findUnique({ where: { code } });
    if (!authCode || authCode.used || authCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Code is invalid, used, or expired' },
        { status: 400, headers: cors },
      );
    }
    if (authCode.clientId !== client.id || authCode.redirectUri !== redirectUri) {
      return NextResponse.json(
        {
          error: 'invalid_grant',
          error_description: 'Code was not issued for this client or redirect_uri',
        },
        { status: 400, headers: cors },
      );
    }

    const authResult = await authenticateClient(client, clientSecret, authCode, codeVerifier);
    if (!authResult.ok) {
      return NextResponse.json(authResult.body, {
        status: authResult.status,
        headers: cors,
      });
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
    return NextResponse.json(resp, { headers: cors });
  }

  if (grantType === 'refresh_token') {
    if (!refreshToken) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400, headers: cors });
    }

    // Refresh requires client_secret (confidential) — public clients with only PKCE
    // cannot refresh without a secret unless we store client type; require secret for now.
    if (!clientSecret) {
      return NextResponse.json(
        {
          error: 'invalid_client',
          error_description: 'client_secret is required for refresh_token grants',
        },
        { status: 401, headers: cors },
      );
    }
    const secretOk = await verifyClientSecret(client.clientSecret, clientSecret);
    if (!secretOk) {
      return NextResponse.json({ error: 'invalid_client' }, { status: 401, headers: cors });
    }

    const stored = await prisma.oAuthToken.findUnique({ where: { token: refreshToken } });
    if (
      !stored ||
      stored.revoked ||
      stored.expiresAt < new Date() ||
      stored.clientId !== client.id ||
      stored.type !== 'REFRESH'
    ) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400, headers: cors });
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

    return NextResponse.json(resp, { headers: cors });
  }

  return NextResponse.json(
    { error: 'unsupported_grant_type' },
    { status: 400, headers: cors },
  );
}
