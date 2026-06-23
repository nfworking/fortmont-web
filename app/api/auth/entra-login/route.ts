// ─── Inside route.ts ──────────────────────────────────────────────────────────
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { createNewSession } from "@/lib/auth"; // Import the function we just exported

const tenantId = process.env.MICROSOFT_ENTRA_TENANT_ID!;
const clientId = process.env.MICROSOFT_ENTRA_CLIENT_ID!;

const AUTH_JWT_SALT = "authjs.session-token";

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export async function POST(req: Request) {
  const { token } = await req.json();
  const authSecret = process.env.AUTH_SECRET;

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 400 });
  }

  if (!authSecret) {
    return Response.json({ error: "Missing AUTH_SECRET" }, { status: 500 });
  }

  try {
    // 1. VERIFY MICROSOFT TOKEN
    const decoded: any = await new Promise((resolve, reject) => {
      jwt.verify(
        token,
        getKey,
        {
          audience: clientId,
          issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        },
        (err, decoded) => {
          if (err) reject(err);
          else resolve(decoded);
        }
      );
    });

    const email = decoded.email || decoded.preferred_username;
    const name = decoded.name;

    // 2. FIND OR CREATE USER
    const user = await prisma.appUsers.upsert({
      where: { email },
      update: {
        displayName: name,
      },
      create: {
        email,
        username: email.split("@")[0],
        displayName: name,
        passwordHash: "", 
        isActive: true,
        isEntraUser: true,
      },
    });

    // 3. CREATE THE DATABASE SESSION FOR THIS MOBILE DEVICE
    const sessionDetails = await createNewSession(user.id);

    // 4. MINT THE ENCODED TOKEN CONTAINING TRACKING DETAILS
    const appToken = await encode({
      secret: authSecret,
      salt: AUTH_JWT_SALT,
      token: {
        sub: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        loginMethod: "entra",
        
        // This links the token to your auth.ts lifecycle checks
        sessionId: sessionDetails.sessionId,
        cookieVersion: sessionDetails.cookieVersion,
        lastVerified: sessionDetails.lastVerified,
      },
    });

    return Response.json({
      token: appToken,
      user,
    });
    
  } catch (error) {
    console.error("[route.ts] Auth pipeline failed:", error);
    return Response.json({ error: "Authentication failed" }, { status: 401 });
  }
}