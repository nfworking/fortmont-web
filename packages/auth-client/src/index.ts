export interface OAuthConfig {
  issuer?: string;
  authBaseUrl?: string;
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  clientSecret?: string;
}

export interface FortmontDiscoveryDocument {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  jwks_uri: string;
  response_types_supported?: string[];
  subject_types_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
  scopes_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  code_challenge_methods_supported?: string[];
  grant_types_supported?: string[];
  claims_supported?: string[];
}

export interface FortmontTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
  id_token?: string;
}

export interface FortmontUserInfo {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

export interface PkcePair {
  verifier: string;
  challenge: string;
}

export interface FortmontClientConfig extends OAuthConfig {
  issuer: string;
}

function normalizeIssuer(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Fortmont issuer is required');
  }

  return trimmed.replace(/\/$/, '');
}

function resolveIssuer(configOrIssuer: OAuthConfig | string): string {
  if (typeof configOrIssuer === 'string') {
    return normalizeIssuer(configOrIssuer);
  }

  return normalizeIssuer(configOrIssuer.issuer ?? configOrIssuer.authBaseUrl ?? '');
}

export function getDiscoveryUrl(issuer: string): string {
  return `${normalizeIssuer(issuer)}/.well-known/openid-configuration`;
}

export function getAuthorizationUrl(config: OAuthConfig, state?: string, codeChallenge?: string): string {
  const issuer = resolveIssuer(config);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: (config.scopes ?? ['openid', 'profile', 'email']).join(' '),
  });

  if (state) params.append('state', state);
  if (codeChallenge) {
    params.append('code_challenge', codeChallenge);
    params.append('code_challenge_method', 'S256');
  }

  return `${issuer}/api/oauth/authorize?${params.toString()}`;
}

export function buildAuthUrl(config: OAuthConfig, state?: string, codeChallenge?: string): string {
  return getAuthorizationUrl(config, state, codeChallenge);
}

export function getTokenUrl(configOrIssuer: OAuthConfig | string): string {
  return `${resolveIssuer(configOrIssuer)}/api/oauth/token`;
}

export function getUserInfoUrl(configOrIssuer: OAuthConfig | string): string {
  return `${resolveIssuer(configOrIssuer)}/api/oauth/userinfo`;
}

export async function getDiscoveryDocument(
  configOrIssuer: OAuthConfig | string,
): Promise<FortmontDiscoveryDocument> {
  const response = await fetch(getDiscoveryUrl(resolveIssuer(configOrIssuer)), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load Fortmont discovery document (${response.status})`);
  }

  return response.json();
}

async function readResponseBody(response: Response): Promise<string> {
  const text = await response.text();
  return text || response.statusText || 'Unknown error';
}

export async function exchangeCode(
  config: OAuthConfig,
  code: string,
  codeVerifier?: string,
): Promise<FortmontTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
  });

  if (config.clientSecret) body.append('client_secret', config.clientSecret);
  if (codeVerifier) body.append('code_verifier', codeVerifier);

  const response = await fetch(getTokenUrl(config), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(
      `Token exchange failed (${response.status}): ${await readResponseBody(response)}`,
    );
  }

  return response.json();
}

export async function fetchUserInfo(
  accessToken: string,
  userInfoEndpointOrIssuer: string,
): Promise<FortmontUserInfo> {
  const userInfoUrl = userInfoEndpointOrIssuer.includes('/api/oauth/userinfo')
    ? userInfoEndpointOrIssuer
    : getUserInfoUrl(userInfoEndpointOrIssuer);

  const response = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user info (${response.status})`);
  }

  return response.json();
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomBytes(length = 32): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function generateState(length = 16): string {
  return base64UrlEncode(randomBytes(length));
}

export function generateCodeVerifier(length = 64): string {
  return base64UrlEncode(randomBytes(length));
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return base64UrlEncode(new Uint8Array(digest));
}

export async function createPkcePair(length = 64): Promise<PkcePair> {
  const verifier = generateCodeVerifier(length);
  return {
    verifier,
    challenge: await generateCodeChallenge(verifier),
  };
}

export function createAuthorizationUrlFromDiscovery(
  discovery: FortmontDiscoveryDocument,
  clientId: string,
  redirectUri: string,
  scopes?: string[],
  state?: string,
  codeChallenge?: string,
  nonce?: string,
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: (scopes ?? ['openid', 'profile', 'email']).join(' '),
  });

  if (state) params.set('state', state);
  if (codeChallenge) {
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  }
  if (nonce) params.set('nonce', nonce);

  return `${discovery.authorization_endpoint}?${params.toString()}`;
}
