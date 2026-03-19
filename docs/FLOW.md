# Authentication Flow

This document describes the client & server authentication flows used by the app and the expected shapes of the API responses.

Summary
- Signup (client): POST /api/auth/register -> server creates account, sets session cookie, returns 201 and user. Client then GETs /api/auth/current to fetch canonical server-side user and persists it to localStorage.currentUser. Finally redirects to a safe returnUrl or /dashboard.
- Login (client): POST /api/auth/login -> server validates credentials, sets session cookie, returns 200 and user. Client then GETs /api/auth/current to fetch canonical user and persists to localStorage.currentUser. Finally redirects to a safe returnUrl or /dashboard.
- Google sign-in: client obtains idToken from Google and POSTs to /api/auth/google -> server sets session cookie; client then GETs /api/auth/current, persists user, and redirects as above.
- Logout (client): POST /api/auth/logout -> server clears cookie; client clears localStorage.currentUser and redirects to /login.
- Protected routes: clients call GET /api/auth/current to confirm session. If the endpoint returns 401, clients should redirect to /login?returnUrl=<original-path>.

Endpoints & expected responses

1) POST /api/auth/register
- Success: 201
  { success: true, user: { id: string, email: string } }
  Response includes Set-Cookie header for the session cookie.
- Errors:
  400 { error: 'Email required' }
  400 { error: 'Password must be at least 6 characters' }
  409 { error: 'Email already in use' }
  500 { error: 'Internal server error' }

2) POST /api/auth/login
- Success: 200
  { success: true, user: { id: string, email: string } }
  Response includes Set-Cookie header for the session cookie.
- Errors:
  400 { error: 'Email and password required' }
  401 { error: 'Invalid credentials' }
  500 { error: 'Internal server error' }

3) GET /api/auth/current
- Authenticated: 200
  { user: { id: string, email: string, displayName: string | null, provider: string, avatarUrl: string | null } }
- Unauthenticated: 401 { error: 'No session' }
- Invalid session: 401 { error: 'Invalid session' }
- Server error: 500 { error: 'Internal server error' }

4) POST /api/auth/logout
- Success: 200 (server clears session cookie)
- Server error: 500

Client responsibilities
- Always call GET /api/auth/current after a successful login/register to get the canonical user object from the server and persist it to localStorage.currentUser.
- Only follow returnUrl values that start with "/" to avoid open-redirects.
- For protected pages, treat /api/auth/current as the source-of-truth; if 401 is returned, redirect user to /login?returnUrl=<encoded current path>.

Notes
- localStorage.currentUser is a convenience cache synchronized after a successful /api/auth/current call. The server-side cookie is the true session.
- The session cookie uses HttpOnly and SameSite=Lax and is set by the server on successful auth.
