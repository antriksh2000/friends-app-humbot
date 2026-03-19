// Basic auth flow checker for local dev
// Usage: BASE_URL=http://localhost:3000 node scripts/check-auth-flow.js

const BASE = process.env.BASE_URL || 'http://localhost:3000';

function nowEmail() {
  return `test+${Date.now()}@example.com`;
}

(async function main() {
  try {
    console.log('Starting auth flow check against', BASE);
    const email = nowEmail();
    const password = 'password123';
    let cookie = null;

    // Try register
    console.log('1) Registering', email);
    let res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 409) {
      console.log(' - Already exists (409). Will attempt login.');
    } else if (res.ok) {
      console.log(' - Registered OK:', res.status);
      const setCookie = res.headers.get('set-cookie');
      if (setCookie) {
        cookie = setCookie.split(';')[0];
        console.log(' - Received Set-Cookie');
      } else {
        console.log(' - No Set-Cookie header received from register.');
      }
    } else {
      const body = await safeJson(res);
      console.error(' - Register failed', res.status, body);
      process.exit(2);
    }

    // Login
    console.log('2) Logging in');
    res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await safeJson(res);
      console.error(' - Login failed', res.status, body);
      process.exit(3);
    }
    const loginSet = res.headers.get('set-cookie');
    if (loginSet) {
      cookie = loginSet.split(';')[0];
      console.log(' - Login returned Set-Cookie');
    } else {
      console.log(' - Login did not return Set-Cookie header; continuing if server uses same-origin cookies');
    }

    // GET current with cookie
    console.log('3) Fetching /api/auth/current');
    res = await fetch(`${BASE}/api/auth/current`, {
      method: 'GET',
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (!res.ok) {
      const body = await safeJson(res);
      console.error(' - /api/auth/current failed', res.status, body);
      process.exit(4);
    }
    const cur = await res.json();
    if (!cur?.user?.email) {
      console.error(' - /api/auth/current returned unexpected payload', cur);
      process.exit(5);
    }
    console.log(' - current user:', cur.user.email);

    // Logout
    console.log('4) Logging out');
    res = await fetch(`${BASE}/api/auth/logout`, {
      method: 'POST',
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (!res.ok) {
      console.error(' - Logout failed', res.status);
      // continue to check /current anyway
    } else {
      console.log(' - Logout ok');
    }

    // Ensure current is unauthorized
    console.log('5) Confirm /api/auth/current returns 401 after logout');
    res = await fetch(`${BASE}/api/auth/current`, {
      method: 'GET',
      headers: cookie ? { Cookie: cookie } : undefined,
    });
    if (res.status === 401) {
      console.log(' - /api/auth/current correctly returned 401 after logout');
      console.log('Auth flow check passed');
      process.exit(0);
    } else {
      const body = await safeJson(res);
      console.error(' - /api/auth/current did not return 401 after logout:', res.status, body);
      process.exit(6);
    }
  } catch (err) {
    console.error('Unexpected error', err);
    process.exit(99);
  }

  async function safeJson(r) {
    try {
      return await r.json();
    } catch (e) {
      return { status: r.status, text: await r.text() };
    }
  }
})();
