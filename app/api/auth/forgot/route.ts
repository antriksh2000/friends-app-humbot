import crypto from "crypto";
import { getUsersCollection } from "../../../lib/mongodb";
import type { UserDoc } from "../../../lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body?.email || "").trim().toLowerCase();
    if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    const users = await getUsersCollection();
    const user = await users.findOne({ email, provider: 'email' }) as UserDoc | null;

    if (!user) {
      // Always return success to avoid user enumeration
      return new Response(JSON.stringify({ message: 'If account exists, reset link sent' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    await users.updateOne({ _id: user._id }, { $set: { resetTokenHash: tokenHash, resetTokenExpires: expires } });

    const resetUrlBase = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const resetUrl = `${resetUrlBase}/reset/${token}`;

    // TODO: Send email via SMTP provider. For development, log and return URL.
    console.log(`Password reset for ${email}: ${resetUrl}`);

    return new Response(JSON.stringify({ message: 'If account exists, reset link sent', resetUrl }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('forgot error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
