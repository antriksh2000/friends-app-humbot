import { hash } from "bcryptjs";
import { getUsersCollection } from "../../../lib/mongodb";
import type { UserDoc } from "../../../lib/types";
import { signSession, makeSessionCookie } from "../../../lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = body?.name ? String(body.name).trim() : undefined;
    if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (password.length < 6) return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const users = await getUsersCollection();
    const existing = await users.findOne({ email });
    if (existing) return new Response(JSON.stringify({ error: 'User exists' }), { status: 409, headers: { 'Content-Type': 'application/json' } });

    const passwordHash = await hash(password, 10);
    const now = Date.now();
    const insertRes = await users.insertOne({ email, passwordHash, provider: 'email', displayName: name || null, createdAt: now, resetTokenHash: null, resetTokenExpires: null } as UserDoc);

    const userId = insertRes.insertedId.toString();
    const token = signSession({ uid: userId, email });
    const cookie = makeSessionCookie(token);

    return new Response(JSON.stringify({ success: true, user: { id: userId, email } }), { status: 201, headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie } });
  } catch (err: any) {
    console.error('register error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
