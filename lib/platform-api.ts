import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type PlatformApiScope =
  | "platform:read"
  | "platform:users"
  | "platform:apps"
  | "platform:storage"
  | "platform:sessions";

export type PlatformApiKeyRecord = {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  scopes: unknown;
  usageCount: number;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string | null;
    isActive: boolean;
  };
};

const PLATFORM_KEY_PREFIX = "fpk";

export function generatePlatformApiKeyMaterial() {
  const secret = crypto.randomBytes(32).toString("hex");
  const apiKey = `${PLATFORM_KEY_PREFIX}_${secret}`;
  const keyHash = hashPlatformApiKey(apiKey);

  return {
    apiKey,
    keyHash,
    prefix: apiKey.slice(0, 12),
  };
}

export function hashPlatformApiKey(apiKey: string) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export function normalizePlatformScopes(scopes: unknown): PlatformApiScope[] {
  if (!Array.isArray(scopes)) return [];

  return scopes.filter((scope): scope is PlatformApiScope =>
    ["platform:read", "platform:users", "platform:apps", "platform:storage", "platform:sessions"].includes(
      String(scope),
    ),
  );
}

export function hasPlatformScope(
  scopes: unknown,
  requiredScopes: PlatformApiScope[],
) {
  const normalizedScopes = normalizePlatformScopes(scopes);

  if (normalizedScopes.includes("platform:read")) return true;
  if (normalizedScopes.some((scope) => scope.startsWith("platform:"))) {
    return requiredScopes.every((scope) => normalizedScopes.includes(scope));
  }

  return requiredScopes.every((scope) => normalizedScopes.includes(scope));
}

export async function authenticatePlatformApiKey(request: Request, requiredScopes: PlatformApiScope[]) {
  const headerValue = request.headers.get("x-api-key") ?? request.headers.get("authorization");
  const apiKey = headerValue?.startsWith("Bearer ") ? headerValue.slice(7).trim() : headerValue?.trim();

  if (!apiKey) return null;

  const keyHash = hashPlatformApiKey(apiKey);
  const keyRecord = await prisma.platformApiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      userId: true,
      name: true,
      prefix: true,
      scopes: true,
      usageCount: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          email: true,
          isActive: true,
        },
      },
    },
  }) as PlatformApiKeyRecord | null;

  if (!keyRecord) return null;
  if (!keyRecord.user.isActive) return null;
  if (keyRecord.revokedAt) return null;
  if (keyRecord.expiresAt && keyRecord.expiresAt <= new Date()) return null;
  if (!hasPlatformScope(keyRecord.scopes, requiredScopes)) return null;

  await prisma.platformApiKey.update({
    where: { id: keyRecord.id },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });

  return keyRecord;
}