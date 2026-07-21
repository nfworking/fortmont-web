import { NextResponse } from 'next/server';
import { getOpenIdConfiguration } from '@/lib/oauth';

export async function GET() {
  return NextResponse.json(getOpenIdConfiguration(), {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
