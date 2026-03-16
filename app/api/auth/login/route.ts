import { compare } from "bcryptjs";
import { getUsersCollection } from "../../../lib/mongodb";
import type { UserDoc } from "../../../lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const users = await getUsersCollection();
    const user = await users.findOne({ email }) as UserDoc | null;
    if (!user || user.provider !== 'email' || !user.passwordHash) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    // TODO: create session / JWT cookie here in production
    return new Response(JSON.stringify({ success: true, user: { id: user._id, email: user.email } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('login error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
