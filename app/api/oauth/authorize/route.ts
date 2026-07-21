import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createOAuthErrorRedirect,
  getOAuthBaseUrl,
  intersectScopes,
  parseScopeList,
} from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

/**
 * Authorization endpoint (OAuth 2.0 / OIDC).
 * Validates the client request, requires a Fortmont session, then redirects
 * to the consent UI. Codes are issued only via POST /api/oauth/consent.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const base = getOAuthBaseUrl();

  const clientId = url.searchParams.get('client_id');
  const redirectUri = url.searchParams.get('redirect_uri');
  const responseType = url.searchParams.get('response_type');
  const scope = url.searchParams.get('scope') || '';
  const state = url.searchParams.get('state');
  const codeChallenge = url.searchParams.get('code_challenge');
  const codeChallengeMethod = url.searchParams.get('code_challenge_method');

  if (!clientId || !redirectUri || responseType !== 'code') {
    return NextResponse.json(
      {
        error: 'invalid_request',
        error_description:
          'Required parameters: response_type=code, client_id, redirect_uri',
      },
      { status: 400 },
    );
  }

  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  const redirectUris = Array.isArray(client?.redirectUris)
    ? (client!.redirectUris as string[])
    : [];

  // Invalid client or unregistered redirect_uri must NOT redirect (open redirect risk)
  if (!client || !redirectUris.includes(redirectUri)) {
    return NextResponse.json(
      {
        error: 'unauthorized_client',
        error_description: 'Unknown client_id or redirect_uri is not registered',
      },
      { status: 400 },
    );
  }

  // PKCE method: only S256 is supported when a challenge is present
  if (codeChallenge && codeChallengeMethod && codeChallengeMethod !== 'S256') {
    return NextResponse.redirect(
      createOAuthErrorRedirect(
        redirectUri,
        'invalid_request',
        'Only code_challenge_method=S256 is supported',
        state,
      ),
    );
  }

  if (codeChallengeMethod === 'S256' && !codeChallenge) {
    return NextResponse.redirect(
      createOAuthErrorRedirect(
        redirectUri,
        'invalid_request',
        'code_challenge is required when code_challenge_method is set',
        state,
      ),
    );
  }

  const allowedScopes = Array.isArray(client.scopes) ? (client.scopes as string[]) : [];
  const requestedScopes = parseScopeList(scope);

  const unknownScopes = requestedScopes.filter((s) => !allowedScopes.includes(s));
  if (unknownScopes.length > 0) {
    return NextResponse.redirect(
      createOAuthErrorRedirect(
        redirectUri,
        'invalid_scope',
        `Unknown scopes: ${unknownScopes.join(', ')}`,
        state,
      ),
    );
  }

  // Ensure at least one scope will be granted
  const grantedScopes =
    requestedScopes.length > 0
      ? intersectScopes(requestedScopes, allowedScopes)
      : [...allowedScopes];

  if (grantedScopes.length === 0) {
    return NextResponse.redirect(
      createOAuthErrorRedirect(
        redirectUri,
        'invalid_scope',
        'No valid scopes requested',
        state,
      ),
    );
  }

  const session = await auth();

  if (!session?.user?.id) {
    // Rebuild authorize URL on the configured public base (avoids proxy host mismatches)
    const authorizeReturn = new URL('/api/oauth/authorize', base);
    for (const key of [
      'response_type',
      'client_id',
      'redirect_uri',
      'scope',
      'state',
      'code_challenge',
      'code_challenge_method',
      'nonce',
    ] as const) {
      const value = url.searchParams.get(key);
      if (value) authorizeReturn.searchParams.set(key, value);
    }

    const loginUrl = new URL('/oauth/login', base);
    loginUrl.searchParams.set('callbackUrl', authorizeReturn.toString());
    loginUrl.searchParams.set('client_id', clientId);
    return NextResponse.redirect(loginUrl);
  }

  // Always show consent — never issue codes from GET (prevents consent bypass)
  const consentUrl = new URL('/oauth/consent', base);
  // Forward original OAuth params only (drop consent= if present)
  const forwardKeys = [
    'response_type',
    'client_id',
    'redirect_uri',
    'scope',
    'state',
    'code_challenge',
    'code_challenge_method',
    'nonce',
  ] as const;

  for (const key of forwardKeys) {
    const value = url.searchParams.get(key);
    if (value) consentUrl.searchParams.set(key, value);
  }

  return NextResponse.redirect(consentUrl);
}
