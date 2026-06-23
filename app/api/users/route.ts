import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { auth } from "@/lib/auth"; 

export const runtime = "nodejs";

function sanitizeAppUser(user: any) {
  return user;
}

export async function GET(req: Request) {
  try {
    const session = await auth(); 

    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.appUsers.findUnique({
      where: { id: session.user.id },
      select: {
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
        notifications: { select: { id: true, type: true, title: true, description: true, read: true, createdAt: true } },
        githubLink: { select: { username: true, profileUrl: true, avatarUrl: true, scope: true, linkedAt: true } },
        sessions: { select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true, lastActive: true } },
        storage: {
          select: {
            quotaBytes: true,
            usedBytes: true,
          }
        },
        files: { select: { id: true, owner:{ select: { id: true, username: true } }, bucket: true, objectKey: true, name: true, size: true } },
        _count: { select: { createdTickets: true, assignedTickets: true } }
      }
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const sanitizedUser = sanitizeAppUser(user);

if (sanitizedUser.storage) {
  sanitizedUser.storage = {
    ...sanitizedUser.storage,
    quotaBytes: Number(sanitizedUser.storage.quotaBytes),
    usedBytes: Number(sanitizedUser.storage.usedBytes),
  };
}

if (sanitizedUser.files && Array.isArray(sanitizedUser.files)) {
  sanitizedUser.files = sanitizedUser.files.map((file: any) => ({
    ...file,
    size: Number(file.size), 
  }));
}

    return Response.json(sanitizedUser);
  } catch (error) {
    console.error("GET user error:", error); 
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  const body = await req.json();

  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName = typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim() : null;
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim().toLowerCase() : null;

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
      phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null,
      passwordHash: hashPassword(password),
      storage: {
        create:{}
      
      }
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
      include: {
        storage: true,
      }
    },
  });

  

  return Response.json(createdUser, { status: 201 });
}