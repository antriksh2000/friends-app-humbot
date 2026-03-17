import { NextResponse } from "next/server";

export async function GET() {
  return new Response(JSON.stringify({ error: "No session" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST() {
  return new Response(JSON.stringify({ error: "No session" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
