# Canvas Dashboard

A self-hosted, multi-user Canvas LMS dashboard built with **Next.js App Router** and **Tailwind CSS**.

---

## Features

- Multi-user support — each user registers their own Canvas API credentials
- Secure user registration and password-based login
- Server-side Canvas API integration (tokens are **never** exposed to the browser)
- Canvas tokens encrypted at rest (AES-256-GCM)
- Dashboard cards for current courses, upcoming assignments & events, recent announcements
- Grades, calendar, classes, and announcements pages
- Mobile-friendly, responsive design
- Ready for self-hosted or Vercel deployment

---

## Security Model

| Concern | Approach |
|---------|----------|
| Canvas token secrecy | Encrypted with AES-256-GCM in SQLite; all API calls run server-side |
| Authentication | Per-user bcrypt password hashes (cost 10) |
| Sessions | Signed httpOnly cookie (`canvas-dashboard-session`) using JWT HS512 with per-token `jti` |
| Session expiry | 7-day absolute + 24-hour idle timeout; invalidated on password change |
| Session revocation | On logout, the token's `jti` is inserted into the `revoked_sessions` DB table; all subsequent checks reject revoked tokens |
| Route protection | `proxy.ts` middleware redirects unauthenticated requests to `/login` |
| Rate limiting | 5 attempts / 15 min per IP on `/api/login` and `/api/signup` |
| Password history | Last 24 hashes enforced on password change |
| Security headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |

---

## Quick Start

```bash
# 1. Install deps
npm install

# 2. Configure env vars
cp .env.example .env.local
# fill in values as described below

# 3. Start dev server
npm run dev
```

### Environment Variables (`.env.local`)

```
JWT_SECRET=<64-char hex string, minimum 32 chars>
CANVAS_ENCRYPTION_KEY=<64-char hex string for AES-256-GCM>
CANVAS_CLIENT_ID=<optional, Canvas OAuth developer key client ID>
CANVAS_CLIENT_SECRET=<optional, Canvas OAuth developer key client secret>
SQLITE_DB_PATH=<optional, defaults to data/canvas-dashboard.db>
NEXT_PUBLIC_BASE_URL=<optional, defaults to http://localhost:3000; required for OAuth redirect URIs>
TRUST_PROXY=<set to "true" only when behind a reverse proxy (nginx, Caddy) that sets x-forwarded-for — enables accurate IP logging>
DEV_ACCESS_KEY=<dev/staging only — passphrase to enable dev testing panel; must NOT be set in production>
```

The SQLite database is created automatically on first run at `data/canvas-dashboard.db`.

---

## Project Structure

```
src/
  app/
    (dashboard)/    # Protected pages: home, assignments, grades, calendar, classes, announcements, profile
    classes/[id]/   # Dynamic class detail sub-pages
    dev-access/     # Hidden dev passphrase page (dev/staging only)
    login/          # Public login page
    signup/         # User registration
    api/
      login/        # POST — authenticate and issue session cookie
      logout/       # POST — revoke token + clear session cookie
      signup/       # POST — dual-mode: OAuth pending cookie or manual user creation
      first-time/   # GET — returns { hasUsers } for bootstrap redirect
      oauth/        # authorize, callback, disconnect, status
      account/      # change-password, delete, token-status, update-canvas-token, login-history
      dev/          # access, revoke, status (dev/staging only)
  components/       # Reusable UI components
  lib/              # Server-side helpers
    auth.ts         # JWT creation/verification, password hashing
    auth-edge.ts    # Edge-compatible JWT verification (for proxy.ts)
    blacklist.ts    # JTI revocation — revokeToken, isTokenRevoked
    canvas.ts       # All Canvas API calls
    db.ts           # SQLite connection, schema init, WAL mode
    encryption.ts   # AES-256-GCM encrypt/decrypt
    oauth.ts        # Canvas OAuth2 helpers
    passwordPolicy.ts # Common password blocklist
    rateLimit.ts    # Per-IP in-memory rate limiting
    session.ts      # getCurrentUserId, getUserIdFromRequest
    users.ts        # User CRUD, credentials management
    audit.ts        # Structured security event logging
  proxy.ts          # Route protection middleware
data/
  canvas-dashboard.db  # SQLite database (auto-created)
```

---

## Stack

Next.js App Router · TypeScript · Tailwind CSS · SQLite (better-sqlite3) · JWT (HS512) · bcryptjs · Framer Motion · jose (edge JWT)

---
