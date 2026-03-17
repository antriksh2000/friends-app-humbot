import { verifySession } from "../../../lib/auth";
import { getUsersCollection } from "../../../lib/mongodb";
import { ObjectId } from "mongodb";

function parseCookie(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map(p => p.trim());
  for (const p of parts) {
    if (p.startsWith(name + '=')) return p.substring(name.length + 1);
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const token = parseCookie(cookieHeader, 'session_token');
    if (!token) return new Response(JSON.stringify({ error: 'No session' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    let payload: any;
    try {
      payload = verifySession(token);
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const users = await getUsersCollection();
    let user: any = null;
    try {
      if (payload?.uid) {
        user = await users.findOne({ _id: new ObjectId(String(payload.uid)) });
      }
    } catch (err) {
      // ignore and try by email
    }

    if (!user && payload?.email) {
      user = await users.findOne({ email: payload.email });
    }

    if (!user) return new Response(JSON.stringify({ error: 'No session' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify({ user: { id: user._id.toString(), email: user.email, displayName: user.displayName || null, provider: user.provider, avatarUrl: user.avatarUrl || null } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('current user error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function POST(req: Request) {
  // Allow POST to also fetch current session if needed
  return GET(req);
}
