import { SignJWT, jwtVerify } from "jose";

const STREAM_TOKEN_AUDIENCE = "notifications-stream";
const STREAM_TOKEN_TTL_SECONDS = 60;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function mintStreamToken(
  userId: string,
  role: string | null
): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience(STREAM_TOKEN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${STREAM_TOKEN_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifyStreamToken(
  token: string
): Promise<{ userId: string; role: string | null } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      audience: STREAM_TOKEN_AUDIENCE,
    });

    if (typeof payload.sub !== "string") {
      return null;
    }

    return {
      userId: payload.sub,
      role: typeof payload.role === "string" ? payload.role : null,
    };
  } catch {
    return null;
  }
}