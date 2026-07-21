import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const clientId = new URL(request.url).searchParams.get('client_id');
  if (!clientId) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
    select: { name: true, scopes: true },
  });

  if (!client) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 404 });
  }

  return NextResponse.json({
    name: client.name,
    scopes: client.scopes as unknown as string[],
  });
}
