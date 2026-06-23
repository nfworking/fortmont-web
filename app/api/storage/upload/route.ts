import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { auth } from "@/lib/auth";

const BUCKET_NAME = process.env.S3_BUCKET || "default";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const currentUserId = session?.user?.id;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ticketId = formData.get("ticketId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileSizeBigInt = BigInt(file.size);

    const storage = await prisma.userStorage.upsert({
      where: { userId: currentUserId },
      update: {},
      create: { userId: currentUserId }, 
    });

    if (storage.usedBytes + fileSizeBigInt > storage.quotaBytes) {
      return NextResponse.json(
        { error: "Upload failed. Storage quota exceeded." },
        { status: 413 } 
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileUuid = crypto.randomUUID();
    const objectKey = `uploads/${currentUserId}/${fileUuid}-${file.name}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: objectKey,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    const [savedFile] = await prisma.$transaction([
      prisma.file.create({
        data: {
          ownerId: currentUserId,
          bucket: BUCKET_NAME,
          objectKey: objectKey,
          name: file.name,
          size: fileSizeBigInt,
          mimeType: file.type || null,
          ticketId: ticketId || null,
          fileActivities: {
            create: {
              userId: currentUserId,
              action: "UPLOAD",
            },
          },
        },
      }),
      prisma.userStorage.update({
        where: { userId: currentUserId },
        data: {
          usedBytes: {
            increment: fileSizeBigInt, 
          },
        },
      }),
    ]);

    return NextResponse.json({
      message: "File uploaded and storage updated.",
      file: {
        id: savedFile.id,
        name: savedFile.name,
        size: savedFile.size.toString(),
      },
    });
  } catch (error) {
    console.error("S3 SDK upload task failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}