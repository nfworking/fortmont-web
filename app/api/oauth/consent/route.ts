import { NextResponse } from 'next/server';
import { addMinutes } from 'date-fns';
import {
  appendQueryToUri,
  createOAuthErrorRedirect,
  generateRandomString,
  intersectScopes,
  parseScopeList,
} from '@/lib/oauth';
import { prisma } from '@/lib/prisma';
import { resolveTicketingActor } from '@/lib/ticketing-auth';

type ConsentBody = {
  action?: 'approve' | 'deny';
  client_id?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  nonce?: string;
};

/**
 * Issues an authorization code after the user approves on the consent screen.
 * Accepts application/json or form-urlencoded.
 */
export async function POST(request: Request) {
  const actor = await resolveTicketingActor(request);
  if (!actor?.userId) {
    return NextResponse.json({ error: 'login_required' }, { status: 401 });
  }

  const actorUser = await prisma.appUsers.findUnique({
    where: { id: actor.userId },
    select: { onboarded: true },
  });

  const contentType = request.headers.get('content-type') || '';
  let body: ConsentBody = {};

  if (contentType.includes('application/json')) {
    body = (await request.json()) as ConsentBody;
  } else {
    const form = await request.formData();
    body = {
      action: (form.get('action') as ConsentBody['action']) || undefined,
      client_id: (form.get('client_id') as string) || undefined,
      redirect_uri: (form.get('redirect_uri') as string) || undefined,
      scope: (form.get('scope') as string) || undefined,
      state: (form.get('state') as string) || undefined,
      code_challenge: (form.get('code_challenge') as string) || undefined,
      code_challenge_method: (form.get('code_challenge_method') as string) || undefined,
      nonce: (form.get('nonce') as string) || undefined,
    };
  }

  const {
    action = 'approve',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope = '',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    nonce,
  } = body;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'client_id and redirect_uri required' },
      { status: 400 },
    );
  }

  const client = await prisma.oAuthClient.findUnique({ where: { clientId } });
  const redirectUris = Array.isArray(client?.redirectUris)
    ? (client!.redirectUris as string[])
    : [];

  if (!client || !redirectUris.includes(redirectUri)) {
    return NextResponse.json(
      { error: 'unauthorized_client', error_description: 'Unknown client or redirect_uri' },
      { status: 400 },
    );
  }

  if (action === 'deny') {
    return NextResponse.json({
      redirect_to: createOAuthErrorRedirect(
        redirectUri,
        'access_denied',
        'The user denied the request',
        state,
      ),
    });
  }

  if (codeChallenge && codeChallengeMethod && codeChallengeMethod !== 'S256') {
    return NextResponse.json({
      redirect_to: createOAuthErrorRedirect(
        redirectUri,
        'invalid_request',
        'Only code_challenge_method=S256 is supported',
        state,
      ),
    });
  }

  const allowedScopes = Array.isArray(client.scopes) ? (client.scopes as string[]) : [];
  const requestedScopes = parseScopeList(scope);
  const unknownScopes = requestedScopes.filter((s) => !allowedScopes.includes(s));

  if (unknownScopes.length > 0) {
    return NextResponse.json({
      redirect_to: createOAuthErrorRedirect(
        redirectUri,
        'invalid_scope',
        `Unknown scopes: ${unknownScopes.join(', ')}`,
        state,
      ),
    });
  }

  const grantedScopes =
    requestedScopes.length > 0
      ? intersectScopes(requestedScopes, allowedScopes)
      : [...allowedScopes];

  if (grantedScopes.length === 0) {
    return NextResponse.json({
      redirect_to: createOAuthErrorRedirect(
        redirectUri,
        'invalid_scope',
        'No valid scopes requested',
        state,
      ),
    });
  }

  const code = await generateRandomString(32);

  await prisma.oAuthCode.create({
    data: {
      code,
      clientId: client.id,
      userId: actor.userId,
      redirectUri,
      scopes: grantedScopes,
      codeChallenge: codeChallenge || undefined,
      nonce: nonce || undefined,
      expiresAt: addMinutes(new Date(), 5),
    },
  });

  const params = new URLSearchParams({ code });
  if (state) params.set('state', state);

  const redirectTo = appendQueryToUri(redirectUri, params);

  if (actorUser?.onboarded !== true) {
    const onboardingUrl = new URL('/onboard/user', request.url);
    onboardingUrl.searchParams.set('callbackUrl', redirectTo);

    return NextResponse.json({
      redirect_to: onboardingUrl.toString(),
    });
  }

  return NextResponse.json({
    redirect_to: redirectTo,
  });
}

/** Convenience GET for form posts that cannot use fetch — not used by default UI. */
export async function GET() {
  return NextResponse.json(
    { error: 'invalid_request', error_description: 'Use POST to approve or deny consent' },
    { status: 405 },
  );
}
