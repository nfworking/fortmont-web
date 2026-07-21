import bcrypt from 'bcryptjs';
import { createHash, createPrivateKey, createPublicKey, randomBytes } from 'crypto';
import {
  SignJWT,
  exportJWK,
  generateKeyPair,
  importPKCS8,
  importSPKI,
  jwtVerify,
  type JWTPayload,
} from 'jose';

const KID = process.env.OAUTH_SIGNING_KID || 'fortmont_key';

let rsaPublicJwk: Record<string, unknown> | null = null;
let rsaPrivateKey: CryptoKey | null = null;
let rsaPublicKey: CryptoKey | null = null;

export function getOAuthBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export function getIssuer(): string {
  return getOAuthBaseUrl();
}

async function loadKeyPairFromEnv(pem: string) {
  const normalizedPem = pem.replace(/\\n/g, '\n');
  rsaPrivateKey = await importPKCS8(normalizedPem, 'RS256');
  const publicKeyPem = createPublicKey(createPrivateKey(normalizedPem)).export({
    type: 'spki',
    format: 'pem',
  }) as string;
  rsaPublicKey = await importSPKI(publicKeyPem, 'RS256');
  rsaPublicJwk = (await exportJWK(rsaPublicKey)) as Record<string, unknown>;
  rsaPublicJwk.kid = KID;
  rsaPublicJwk.alg = 'RS256';
  rsaPublicJwk.use = 'sig';
}

async function getKeyPair() {
  if (rsaPublicJwk && rsaPrivateKey && rsaPublicKey) {
    return { rsaPublicJwk, rsaPrivateKey, rsaPublicKey };
  }

  const signingKeyPem = process.env.OAUTH_SIGNING_KEY;
  if (signingKeyPem) {
    await loadKeyPairFromEnv(signingKeyPem);
    return { rsaPublicJwk: rsaPublicJwk!, rsaPrivateKey: rsaPrivateKey!, rsaPublicKey: rsaPublicKey! };
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('OAUTH_SIGNING_KEY must be set in production');
  }

  console.warn('[oauth] OAUTH_SIGNING_KEY is not set; generating an ephemeral RS256 key pair for development');
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  rsaPrivateKey = privateKey;
  rsaPublicKey = publicKey;
  rsaPublicJwk = (await exportJWK(publicKey)) as Record<string, unknown>;
  rsaPublicJwk.kid = KID;
  rsaPublicJwk.alg = 'RS256';
  rsaPublicJwk.use = 'sig';
  return { rsaPublicJwk, rsaPrivateKey, rsaPublicKey };
}

export async function getPublicKey(): Promise<CryptoKey> {
  const { rsaPublicKey: key } = await getKeyPair();
  return key;
}

export async function signAccessToken(payload: JWTPayload, expiresIn: string = '1h') {
  const { rsaPrivateKey: key } = await getKeyPair();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setIssuer(getIssuer())
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function signIdToken(
  payload: JWTPayload,
  audience: string,
  expiresIn: string = '1h',
) {
  const { rsaPrivateKey: key } = await getKeyPair();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid: KID })
    .setIssuer(getIssuer())
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifyAccessToken(token: string) {
  const publicKey = await getPublicKey();
  return jwtVerify(token, publicKey, { issuer: getIssuer() });
}

export async function getJWKS() {
  const { rsaPublicJwk: jwk } = await getKeyPair();
  return { keys: [jwk] };
}

export async function verifyClientSecret(clientSecretHash: string, secret: string): Promise<boolean> {
  return bcrypt.compare(secret, clientSecretHash);
}

export async function hashClientSecret(secret: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(secret, salt);
}

export async function generateRandomString(length: number = 32): Promise<string> {
  return randomBytes(length).toString('hex');
}

export function parseScopeList(scope: string | null | undefined): string[] {
  return (scope ?? '')
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function intersectScopes(requested: string[], allowed: string[]): string[] {
  const allowedSet = new Set(allowed);
  return requested.filter((scope) => allowedSet.has(scope));
}

export function scopesInclude(scopes: string[] | null | undefined, scope: string): boolean {
  return (scopes ?? []).includes(scope);
}

export function scopesFromJson(value: unknown): string[] {
  return Array.isArray(value) ? (value as string[]) : [];
}

/** Append query params to a redirect URI that may already contain a query string. */
export function appendQueryToUri(uri: string, params: URLSearchParams): string {
  const qs = params.toString();
  if (!qs) return uri;
  return uri.includes('?') ? `${uri}&${qs}` : `${uri}?${qs}`;
}

export function createOAuthErrorRedirect(
  redirectUri: string,
  error: string,
  errorDescription?: string,
  state?: string | null,
) {
  const params = new URLSearchParams({ error });
  if (errorDescription) params.set('error_description', errorDescription);
  if (state) params.set('state', state);
  return appendQueryToUri(redirectUri, params);
}

/** S256 code_challenge = BASE64URL(SHA256(code_verifier)) */
export function verifyPkceS256(codeVerifier: string, codeChallenge: string): boolean {
  const hash = createHash('sha256').update(codeVerifier).digest('base64url');
  return hash === codeChallenge;
}

export function getOpenIdConfiguration() {
  const base = getOAuthBaseUrl();
  return {
    issuer: base,
    authorization_endpoint: `${base}/api/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    userinfo_endpoint: `${base}/api/oauth/userinfo`,
    jwks_uri: `${base}/api/jwks`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    code_challenge_methods_supported: ['S256'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    claims_supported: ['sub', 'name', 'email', 'picture'],
  };
}
