import crypto from "crypto";
import { hash } from "bcryptjs";
import { getUsersCollection } from "../../../lib/mongodb";
import type { UserDoc } from "../../../lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = String(body?.token || "");
    const password = String(body?.password || "");
    if (!token || !password) return new Response(JSON.stringify({ error: 'Token and password required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (password.length < 6) return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const users = await getUsersCollection();

    const user = await users.findOne({ resetTokenHash: tokenHash, resetTokenExpires: { $gt: Date.now() } }) as UserDoc | null;
    if (!user) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const newHash = await hash(password, 10);
    await users.updateOne({ _id: user._id }, { $set: { passwordHash: newHash, resetTokenHash: null, resetTokenExpires: null } });

    return new Response(JSON.stringify({ message: 'Password has been reset' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('reset error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
