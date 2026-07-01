// app/api/storage/download/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { decode } from "next-auth/jwt";

export const runtime = "nodejs";

const BUCKET_NAME = process.env.S3_BUCKET!;
const AUTH_JWT_SALT = "authjs.session-token";

async function resolveUserId(req: NextRequest): Promise<string | null> {
  // 1 — Bearer token (mobile)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const authSecret = process.env.AUTH_SECRET;

    if (authSecret) {
      try {
        const decoded: any = await decode({
          token,
          secret: authSecret,
          salt: AUTH_JWT_SALT,
        });
        if (decoded?.sub) return decoded.sub;
      } catch (error) {
        console.error("Failed to decode mobile token:", error);
        return null;
      }
    }
  }

  // 2 — Auth.js cookie session (web)
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await resolveUserId(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = req.nextUrl.searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (file.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.objectKey,
      ResponseContentDisposition: `attachment; filename="${file.name}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json({ url: downloadUrl, fileName: file.name });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}