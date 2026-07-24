import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3";
import { resolveTicketingActor } from "@/lib/ticketing-auth";

const BUCKET_NAME = process.env.S3_BUCKET!;

export const runtime = "nodejs";

function sanitizeAppUser(user: any) {
  if (!user) return user;
  
  const sanitized = { ...user };

  if (sanitized.storage) {
    sanitized.storage = {
      ...sanitized.storage,
      quotaBytes: Number(sanitized.storage.quotaBytes),
      usedBytes: Number(sanitized.storage.usedBytes),
    };
  }

  if (sanitized.files && Array.isArray(sanitized.files)) {
    sanitized.files = sanitized.files.map((file: any) => ({
      ...file,
      size: Number(file.size),
    }));
  }

  return sanitized;
}

const userSelectFields = {
  id: true,
  username: true,
  displayName: true,
  email: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  isEntraUser: true,
  phone: true,
  mailboxes: { select: { id: true, email: true, isPrimary: true } },
  teams: { select: { id: true, name: true, description: true } },
  deviceTokens: { select: { id: true, platform: true, createdAt: true, deviceVersion: true, deviceName: true, deviceModelName: true, deviceBrand: true } },
  notifications: {
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      read: true,
      createdAt: true,
    },
  },
  githubLink: {
    
  },
  sessions: {
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      signInUrl: true,
      createdAt: true,
      expiresAt: true,
      lastActive: true,
    },
  },
  storage: {
    select: {
      quotaBytes: true,
      usedBytes: true,
    },
  },
  files: {
    select: {
      id: true,
      owner: { select: { id: true, username: true } },
      bucket: true,
      objectKey: true,
      name: true,
      size: true,
    },
  },
  _count: { select: { createdTickets: true, assignedTickets: true } },
};

export async function GET(req: Request) {
  try {
    const actor = await resolveTicketingActor(req);

    if (!actor?.userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if the 'all' header is present
    const fetchAll = req.headers.get("all") !== null;

    if (fetchAll) {
      // Fetch all users using findMany
      const users = await prisma.appUsers.findMany({
        select: userSelectFields,
      });

      const sanitizedUsers = users.map(user => sanitizeAppUser(user));
      return Response.json(sanitizedUsers);
    } else {
      // Fetch the single authenticated user using our resolved token identity
      const user = await prisma.appUsers.findUnique({
        where: { id: actor.userId },
        select: userSelectFields,
      });

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      return Response.json(sanitizeAppUser(user));
    }
  } catch (error) {
    console.error("GET user error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();

  const username =
    typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : null;
  const email =
    typeof body.email === "string" && body.email.trim()
      ? body.email.trim().toLowerCase()
      : null;

  if (!username || !password) {
    return Response.json(
      { error: "username and password are required" },
      { status: 400 },
    );
  }

  const existingUser = await prisma.appUsers.findFirst({
    where: {
      OR: [{ username }, ...(email ? [{ email }] : [])],
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return Response.json(
      { error: "A user with that username or email already exists" },
      { status: 409 },
    );
  }

  const createdUser = await prisma.appUsers.create({
    data: {
      username,
      displayName,
      email,
      phone:
        typeof body.phone === "string" && body.phone.trim()
          ? body.phone.trim()
          : null,
      passwordHash: hashPassword(password),
      storage: {
        create: {},
      },
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      storage: true,
    },
  });

  return Response.json(sanitizeAppUser(createdUser), { status: 201 });
}

export async function DELETE(req: Request) {
  try {
    const actor = await resolveTicketingActor(req);
    if (!actor?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = actor.userId;

    // Fetch all files belonging to the user
    const userFiles = await prisma.file.findMany({
      where: { ownerId: userId },
      select: { id: true, objectKey: true, size: true },
    });

    // Delete each file from S3
    for (const file of userFiles) {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: file.objectKey,
        })
      );
    }

    // Transaction: delete file records, reset storage, delete user
    await prisma.$transaction([
      prisma.file.deleteMany({ where: { ownerId: userId } }),
      prisma.userStorage.update({
        where: { userId },
        data: { usedBytes: 0 },
      }),
      prisma.appUsers.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User deletion failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
