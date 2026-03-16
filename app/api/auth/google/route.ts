import { getUsersCollection } from "../../../lib/mongodb";
import { verifyIdToken } from "../../../lib/firebaseAdmin";
import type { UserDoc } from "../../../lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idToken = String(body?.idToken || "");
    if (!idToken) return new Response(JSON.stringify({ error: 'idToken required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    let decoded: any;
    try {
      decoded = await verifyIdToken(idToken);
    } catch (err: any) {
      console.error('token verify failed', err);
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const uid = decoded.uid as string;
    const email = (decoded.email as string | undefined) || undefined;
    if (!uid) return new Response(JSON.stringify({ error: 'Invalid token payload' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    const users = await getUsersCollection();

    // Try to find by providerId
    let user = await users.findOne({ providerId: uid, provider: 'google' }) as UserDoc | null;

    if (!user && email) {
      // Try to find by email for google provider
      user = await users.findOne({ email, provider: 'google' }) as UserDoc | null;
    }

    if (!user) {
      // Check for conflicting email/password account
      if (email) {
        const conflict = await users.findOne({ email, provider: 'email' });
        if (conflict) {
          return new Response(JSON.stringify({ error: 'An account with this email exists with a password. Please sign in using email provider or link accounts.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }
      }

      const now = Date.now();
      const insertRes = await users.insertOne({ email: email || null, provider: 'google', providerId: uid, createdAt: now, passwordHash: null, resetTokenHash: null, resetTokenExpires: null } as UserDoc);
      user = await users.findOne({ _id: insertRes.insertedId }) as UserDoc | null;
    }

    // TODO: Set session/JWT in production
    return new Response(JSON.stringify({ success: true, user: { id: user?._id, email: user?.email, provider: user?.provider } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('google auth error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
