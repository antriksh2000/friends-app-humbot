import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');

export const COOKIE_NAME = 'session_token';

export function signSession(payload: { uid: string; email?: string }, opts?: { expiresIn?: string }): string {
  const expiresIn = opts?.expiresIn || '7d';
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn });
}

export function verifySession(token: string): any {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as any;
    return decoded;
  } catch (err) {
    throw new Error('Invalid session token');
  }
}

export function makeSessionCookie(token: string, maxAgeSeconds?: number): string {
  const defaultMax = 7 * 24 * 3600; // 7 days
  const maxAge = typeof maxAgeSeconds === 'number' ? Math.floor(maxAgeSeconds) : defaultMax;
  const secure = process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}
