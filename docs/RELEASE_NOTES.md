# Release Notes: Authentication Flow Improvements

This release improves the reliability and security of authentication flows and adds a local verification script.

What changed
- Client-side login and register pages now call /api/auth/current after successful auth to hydrate the canonical server user and persist it to localStorage.currentUser.
- Google sign-in flow behaves the same: server session is followed by client-side hydration and redirect.
- Register endpoint now returns 409 with a clear "Email already in use" message for duplicates and sets the same session cookie as login.
- Dashboard now verifies the session with /api/auth/current on load, shows loading and error states, and redirects unauthenticated users to /login?returnUrl=....
- Logout now POSTs to /api/auth/logout before clearing local cache and redirecting.
- Added scripts/check-auth-flow.js to validate register→login→current→logout flows locally.
- Added docs/FLOW.md and this release notes file.

How to test (manual checklist)
- Start dev server (e.g. npm run dev).
- Visit /register?returnUrl=/some/page, register a new user, confirm you end up at the returnUrl or /dashboard and localStorage.currentUser is set.
- Visit /login?returnUrl=/some/page, login with valid credentials, confirm you end up at the returnUrl or /dashboard and localStorage.currentUser is set.
- Use the Logout button on the dashboard; verify you are redirected to /login and localStorage.currentUser is cleared.
- Try invalid credentials on login and duplicate email on register to confirm readable error messages.
- Visit /dashboard when unauthenticated and verify you are redirected to /login?returnUrl=/dashboard.
- Run the automated verifier: BASE_URL=http://localhost:3000 node scripts/check-auth-flow.js

Rollback
- To rollback, restore the previous commit or branch prior to this release.

Notes
- The verification script assumes your dev server is at http://localhost:3000 by default. You can change it via the BASE_URL env var.
- The client will only follow returnUrl values that start with "/" to avoid open redirect vulnerabilities.

Acceptance checklist
- [ ] Successful login and register set server session cookie and client hydrates /api/auth/current into localStorage.currentUser.
- [ ] Safe redirect to returnUrl (local) or /dashboard after auth.
- [ ] Duplicate email returns 409 with clear message.
- [ ] Dashboard validates session on load and redirects unauthenticated users to login with returnUrl.
- [ ] Logout calls /api/auth/logout, clears localStorage.currentUser and redirects to /login.
- [ ] scripts/check-auth-flow.js runs and exits 0 on success.
