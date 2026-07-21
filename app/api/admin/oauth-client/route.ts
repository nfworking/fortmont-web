import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hashClientSecret, generateRandomString } from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

function isAdmin(session: { user?: { id?: string; role?: string } } | null | undefined) {
  const user = session?.user;
  return Boolean(user?.id && user.role === 'admin');
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clients = await prisma.oAuthClient.findMany({
    select: { id: true, clientId: true, name: true, redirectUris: true, scopes: true, createdAt: true },
  });
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, redirectUris, scopes } = await request.json();
  const clientId = crypto.randomUUID();
  const rawSecret = await generateRandomString(32);
  const clientSecret = await hashClientSecret(rawSecret);
  const client = await prisma.oAuthClient.create({
    data: {
      clientId,
      clientSecret,
      name,
      redirectUris: redirectUris as string[],
      scopes: scopes as string[],
    },
    select: { clientId: true, name: true },
  });

  return NextResponse.json({ clientId: client.clientId, clientSecret: rawSecret, name: client.name });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await request.json();
  await prisma.oAuthClient.delete({ where: { clientId } });
  return NextResponse.json({ success: true });
}
