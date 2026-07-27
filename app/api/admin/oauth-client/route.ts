import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { resolveTicketingActor } from '@/lib/ticketing-auth';
import { hashClientSecret, generateRandomString } from '@/lib/oauth';
import { prisma } from '@/lib/prisma';

function isAdmin(actor: { userId: string; userRole: string | null } | null) {
  return Boolean(actor?.userId && actor.userRole === 'admin');
}

export async function GET(request: Request) {
  const actor = await resolveTicketingActor(request);
  if (!isAdmin(actor)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clients = await prisma.oAuthClient.findMany({
    select: { id: true, clientId: true, name: true, redirectUris: true, scopes: true, createdAt: true },
  });
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  const actor = await resolveTicketingActor(request);
  if (!isAdmin(actor)) {
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
  const actor = await resolveTicketingActor(request);
  if (!isAdmin(actor)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { clientId } = await request.json();
  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
    select: { id: true },
  });

  if (!client) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.oAuthCode.deleteMany({ where: { clientId: client.id } }),
    prisma.oAuthToken.deleteMany({ where: { clientId: client.id } }),
    prisma.oAuthClient.delete({ where: { clientId } }),
  ]);
  return NextResponse.json({ success: true });
}
