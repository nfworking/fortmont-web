import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export const runtime = "nodejs";

function sanitizeAppUser(user: {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  phone: string | null;
  teams: {
    id: string;
    name: string;
    description: string | null;
  }[];
}) {
  return user;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? undefined;
  const username = searchParams.get("username")?.trim().toLowerCase();
  const email = searchParams.get("email") ?? undefined;

 const users = await prisma.appUsers.findMany({
  where: {
    id,
    username,
    email,
  },
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

    mailboxes: {
      select: {
        id: true,
        email: true,
        isPrimary: true,
      },
    },
    teams: {
      select: {
        id: true,
        name: true,
        description: true,
      },
    },
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
      select: {
        username: true,
        profileUrl: true,
        avatarUrl: true,
        scope: true,
        linkedAt: true,
      }
    }
  },
}
);

  return Response.json(users.map(sanitizeAppUser));
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
    },
  });

  return Response.json(createdUser, { status: 201 });
}