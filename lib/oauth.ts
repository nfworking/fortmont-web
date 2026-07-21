import bcrypt from 'bcryptjs';
import { createPrivateKey, createPublicKey, randomBytes } from 'crypto';
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

function getIssuer(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
