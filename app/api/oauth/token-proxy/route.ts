import { NextResponse } from 'next/server';

/**
 * Proxy that adds the confidential client secret.
 * The secret is loaded from a server‑only env var:
 *   FORTMONT_CLIENT_SECRET
 * (no NEXT_PUBLIC_ prefix – never sent to the browser)
 */
export async function POST(request: Request) {
  const { code, redirect_uri } = await request.json();

  const clientId = process.env.NEXT_PUBLIC_FORTMONT_CLIENT_ID;
  const clientSecret = process.env.FORTMONT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Server misconfiguration – missing client ID or secret' },
      { status: 500 },
    );
  }

  const tokenUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/oauth/token`;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri,
    code,
  });

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await tokenRes.json();
  return NextResponse.json(data, { status: tokenRes.status });
}