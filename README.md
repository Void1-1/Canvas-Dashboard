# Canvas Dashboard

A self-hosted, multi-user dashboard for Canvas LMS — built with **Next.js**, **TypeScript**, and **Tailwind CSS**.

Canvas Dashboard gives students a cleaner, faster, and more feature-rich interface on top of their institution's Canvas installation. Each user connects their own Canvas account; no data is shared between users. All Canvas API calls happen server-side, so credentials are never exposed to the browser.

---

## Features

- **Multi-user** — each user registers independently with their own Canvas credentials
- **Full dashboard** — home overview, assignments, grades, calendar, classes, and announcements
- **Class detail pages** — assignments, grades, announcements, modules, pages, files, quizzes, discussions, syllabus, people
- **Inbox** — read Canvas conversations and messages
- **Notifications** — Canvas notification stream
- **Personal to-do list** — track your own tasks separate from Canvas assignments
- **Search** — search across courses, assignments, and pages
- **Assignment submissions** — view submission status, rubric breakdowns, and submission history
- **Discussion threads** — read and reply to course discussions
- **Profile & account management** — display name, avatar, password change, login history, account deletion
- **Canvas OAuth2** — optional OAuth mode: users authorize through Canvas instead of pasting API tokens
- **Canvas token renewal** — warnings and in-app renewal flow when a manual token is nearing expiry
- **Dark mode** — full dark/light theme support
- **Mobile-friendly** — responsive layout with a dedicated mobile navigation bar
- **Security-first** — encrypted tokens at rest, JWT sessions with revocation, rate limiting, CSP headers, and audit logging

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT HS512 (`jose` + `jsonwebtoken`), bcryptjs |
| Encryption | AES-256-GCM (`node:crypto`) |
| Testing | Vitest |

---

## Security Model

| Concern | Approach |
|---------|----------|
| Canvas token secrecy | Encrypted with AES-256-GCM in SQLite; all API calls run server-side — tokens never reach the browser |
| Authentication | Per-user bcrypt password hashes (cost 10) |
| Sessions | Signed httpOnly cookie (`canvas-dashboard-session`) using JWT HS512; per-token `jti` |
| Session expiry | 7-day absolute + 24-hour idle timeout (sliding window); invalidated on password change |
| Session revocation | On logout, `jti` is inserted into the `revoked_sessions` DB table; all subsequent checks reject revoked tokens |
| Route protection | `src/proxy.ts` middleware redirects unauthenticated requests to `/login` |
| Rate limiting | 5 attempts / 15 min per IP on `/api/login` and `/api/signup` |
| Password history | Last 24 password hashes enforced on change |
| Security headers | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| CSRF (OAuth) | Encrypted `state` nonce embedded in `oauth_state` cookie; verified on callback |
| Audit logging | Structured JSON audit events for login, logout, signup, password change, OAuth actions |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### 1. Clone and install

```bash
git clone https://github.com/Void1-1/Canvas-Reskin.git
cd Canvas-Reskin
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in the required values (see [Environment Variables](#environment-variables) below).

To generate secure random values for `JWT_SECRET` and `CANVAS_ENCRYPTION_KEY`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run the command twice — once for each key.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database is created automatically at `data/canvas-dashboard.db` on first run. The first user to register becomes the initial account.

---

## Environment Variables

All variables go in `.env.local`. Copy `.env.example` as a starting point.

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** | 64-char hex string (min 32 chars) — signs and verifies session JWTs |
| `CANVAS_ENCRYPTION_KEY` | **Yes** | 64-char hex string — AES-256-GCM key for encrypting Canvas tokens at rest |
| `CANVAS_CLIENT_ID` | OAuth mode only | Canvas developer key client ID — enables OAuth mode when set with `CANVAS_CLIENT_SECRET` |
| `CANVAS_CLIENT_SECRET` | OAuth mode only | Canvas developer key client secret |
| `NEXT_PUBLIC_BASE_URL` | Yes (for OAuth) | Public URL of your deployment, e.g. `https://canvas.example.com` — used for OAuth redirect URIs |
| `SQLITE_DB_PATH` | No | Full path to the SQLite database file. Defaults to `<cwd>/data/canvas-dashboard.db` |
| `TRUST_PROXY` | No | Set to `"true"` only when running behind a reverse proxy (nginx, Caddy) that sets `x-forwarded-for` — enables accurate IP logging and rate limiting |
| `AUDIT_LOG_FILE` | No | Absolute path to a file for persistent audit log storage, e.g. `/var/log/canvas-dashboard/audit.log`. If unset, audit events go to stdout only |

---

## Canvas OAuth vs Manual Token Mode

The app supports two ways for users to connect their Canvas account, selected automatically based on environment variables:

| Mode | When active | User experience at signup |
|------|-------------|--------------------------|
| **OAuth mode** | `CANVAS_CLIENT_ID` and `CANVAS_CLIENT_SECRET` are set | User authorizes through Canvas — no token required |
| **Manual mode** | OAuth env vars absent | User pastes a Canvas API token during signup |

### Setting up OAuth mode

1. Your Canvas institution's admin must create a **Developer Key**:
   - Canvas Admin → Developer Keys → +Developer Key
   - Set the redirect URI to: `${NEXT_PUBLIC_BASE_URL}/api/oauth/callback`
   - Copy the client ID and secret

2. Add to `.env.local`:
   ```
   CANVAS_CLIENT_ID=<client-id>
   CANVAS_CLIENT_SECRET=<client-secret>
   NEXT_PUBLIC_BASE_URL=https://your-deployment-url.com
   ```

> **Note:** Developer keys are institution-scoped. One deployment of this app supports one Canvas institution.

### Using manual token mode (no developer key)

Users generate a personal API token in Canvas (Account → Settings → New Access Token) and paste it during signup. This mode requires no special setup but does not auto-refresh tokens — Canvas tokens expire after ~120 days and users will be prompted to renew.

---

## Production Deployment

### Build

```bash
npm run build
```

### Run with PM2

An `ecosystem.config.js` is included for [PM2](https://pm2.keymetrics.io/):

```bash
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save          # persist process list across reboots
pm2 startup       # generate and enable startup script
```

Logs are written to `logs/canvas-dashboard.out.log` and `logs/canvas-dashboard.error.log`.

### Reverse proxy (nginx / Caddy)

Run the Next.js process on a local port (default: 3000) and proxy to it. If your proxy sets `x-forwarded-for`, add `TRUST_PROXY=true` to `.env.local`.

Example nginx snippet:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## Development

### Commands

```bash
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm test           # Run tests (single run)
npm run test:watch # Run tests in watch mode
```

### Project Structure

```
src/
  app/
    (dashboard)/          # Protected pages (requires login)
      page.tsx            # Home / overview
      assignments/        # All assignments across courses
      grades/             # Grades overview
      calendar/           # Calendar view
      classes/            # Course list
      announcements/      # All announcements
      notifications/      # Canvas notifications
      inbox/              # Canvas inbox / conversations
      todo/               # Personal to-do list
      profile/            # Account settings and profile
    classes/[id]/         # Course detail pages
      page.tsx            # Course home
      assignments/        # Course assignments
      grades/             # Course grades
      announcements/      # Course announcements
      modules/            # Course modules
      pages/              # Course wiki pages
      files/              # Course files
      quizzes/            # Course quizzes
      discussions/        # Course discussions
      syllabus/           # Course syllabus
      people/             # Course roster
    login/                # Login page
    signup/               # User registration
    api/
      login/              # POST — authenticate and issue session cookie
      logout/             # POST — revoke token + clear cookie
      signup/             # POST — create account (OAuth or manual mode)
      first-time/         # GET — { hasUsers } for bootstrap redirect
      oauth/              # authorize, callback, disconnect, status
      account/            # change-password, delete, update-profile, update-avatar,
                          #   update-canvas-token, token-status, login-history
      courses/            # GET — course list
      assignments/[id]/   # GET assignment detail + submission history
      comments/           # Assignment comments
      submit/             # Assignment submission
      discussions/        # Discussion reply
      inbox/              # Conversation detail
      search/             # Search endpoint
      canvas-image/       # Proxied Canvas image loader
      user/               # Current user info
  components/             # Reusable UI components
  lib/
    auth.ts               # JWT creation/verification, password hashing
    auth-edge.ts          # Edge-compatible JWT verification (proxy.ts)
    blacklist.ts          # JTI revocation — revokeToken, isTokenRevoked
    canvas.ts             # All Canvas API calls (request-level deduplication via cache())
    db.ts                 # SQLite connection, schema init, WAL mode
    encryption.ts         # AES-256-GCM encrypt/decrypt
    oauth.ts              # Canvas OAuth2 helpers
    passwordPolicy.ts     # Common password blocklist
    rateLimit.ts          # Per-IP in-memory rate limiting
    session.ts            # getCurrentUserId(), getUserIdFromRequest()
    users.ts              # User CRUD, credentials management, token refresh
    audit.ts              # Structured security event logging
  proxy.ts                # Next.js middleware — route protection, session refresh
data/
  canvas-dashboard.db     # SQLite database (auto-created on first run)
```

### Architecture

```
Client → proxy.ts (session cookie check) → Server Component or API Route
       → getCurrentUserId() / getUserIdFromRequest() (JWT verification + timeout)
       → lib/users.ts (getCredentials / getCredentialsWithRefresh)
       → lib/canvas.ts (Canvas API)
```

**Canvas API calls** — all calls are in `src/lib/canvas.ts` and use React `cache()` for request-level deduplication. Credentials are fetched per-call via `getCredentialsWithRefresh(userId)`, which handles lazy OAuth token refresh automatically.

**Database** — SQLite with WAL mode enabled. Schema is initialized automatically in `src/lib/db.ts` with safe `ALTER TABLE` migrations for new columns.

**Sessions** — JWT payload: `{ sub: userId, jti, iat, origIat }`. The `jti` enables single-token revocation on logout. `origIat` enforces the 7-day absolute limit.

### Adding a new page

1. Create a server component under `src/app/(dashboard)/your-page/page.tsx`
2. Call `getCurrentUserId()` at the top — it redirects to `/login` if unauthenticated
3. Fetch data via functions in `src/lib/canvas.ts`
4. Pass data to a client component in `src/components/` for interactivity

### Adding a new API route

1. Create `src/app/api/your-route/route.ts`
2. Call `getUserIdFromRequest(req)` — throws a `Response` (401) if unauthenticated
3. Add the route to `PUBLIC_PATHS` in `src/proxy.ts` only if authentication should be skipped

### Component conventions

Extract any JSX block over ~30 lines or used in more than one place into `src/components/`. Server components use the `.server.tsx` suffix. Client components that need hooks use `.tsx` and are marked `"use client"`.

---

## Versioning

This project uses semantic versioning (`MAJOR.MINOR.PATCH`) tracked in `package.json`.

| Bump | When |
|------|------|
| `PATCH` | Bug fixes, security patches, dependency updates |
| `MINOR` | New user-facing features, backward-compatible |
| `MAJOR` | Breaking changes or fundamental architectural shifts |

GitHub release tags use the format `V{version}` (e.g. `V1.1.1`).

---

## Repository Branches

| Branch | Purpose |
|--------|---------|
| `main` | Active development — full history, all docs and dev tooling |
| `prod` | Release-ready — filtered subset of `main`; excludes dev docs, Claude config, and GitHub Actions. Source for public releases. |

---

**Licensed for personal use. Have fun & study well!**
