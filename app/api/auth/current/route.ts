import { NextResponse } from 'next/server';

export async function GET() {
  return new NextResponse(JSON.stringify({ error: 'No session' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
