# audit-tool

## 1. Description

**audit-tool** is a production-grade enterprise web application for **audit management and
auditor scheduling**. It lets an organization define audit types, plan and track audits through
a controlled lifecycle, assign qualified auditors to that work, and resolve scheduling conflicts
before they happen.

Core capabilities:

- **Audit types & audits** — configurable audit types (default duration, required skills) and
  full audit records (subject, status, scheduled window, location, priority, notes).
- **Audit lifecycle** — enforced state machine (`Draft → Planned → Scheduled → In Progress →
  Completed → Cancelled → Archived`) with a full history trail; invalid transitions are rejected
  server-side.
- **Auditor scheduling & conflict detection** — assignments are checked against each auditor's
  availability, existing bookings, required skills, and workload before they're allowed, with
  timezone/DST-aware recurring-availability math.
- **Interactive calendars** — auditors manage their own working hours, unavailability, and
  vacations; managers get a global calendar/dashboard of their team's availability, workload,
  assignments, and conflicts.
- **Role-based dashboards** — dedicated views for **Administrators**, **Managers**, and
  **Auditors**, each scoped to what that role is allowed to see and do.
- **Admin panel** — manage users, teams, audit types, role assignments, system configuration,
  and a full audit log of sensitive actions.
- **Security by default** — server-enforced RBAC, hashed credentials, session-based auth with
  CSRF protection, rate limiting, input validation, and centralized audit logging, following
  OWASP practices throughout.
- **Accessible, responsive UI** — light and dark themes, WCAG 2.2 AA contrast targets, and a
  layout that works across desktop, tablet, and mobile.

The application is single-tenant: one deployment serves one organization.

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | [Svelte 5](https://svelte.dev) (runes) + [Vite 8](https://vitejs.dev), TypeScript (strict) |
| Backend | [Node.js](https://nodejs.org) 20 LTS + [Express](https://expressjs.com), TypeScript (strict) |
| Database | [MongoDB](https://www.mongodb.com) + [Mongoose](https://mongoosejs.com) 8.2 |
| Shared | Zod schemas / TS types shared between client and server (`shared/` workspace) |
| Auth & sessions | `express-session` + `connect-mongo` (MongoDB-backed sessions), httpOnly/secure cookies |
| Security middleware | `helmet` (CSP & headers), `cors`, `express-rate-limit`, CSRF protection |
| Logging | `pino` / `pino-http` (structured logs), centralized Express error handling |
| Testing | `vitest` (unit), `supertest` + `mongodb-memory-server` (API integration), `@testing-library/svelte` (component), `playwright` (E2E) |
| Tooling | npm workspaces (monorepo), TypeScript project-wide strict mode |

Repository layout:

```
audit-tool/
  shared/   Zod schemas + TypeScript types used by both client and server
  server/   Express + Mongoose REST API
  web/      Vite + Svelte 5 SPA
```

## 3. Setting up the server on an Ubuntu 24.04 VPS

These steps take a fresh Ubuntu 24.04 (noble) VPS to a running instance of this application.
Run them as a non-root user with `sudo` access.

### 3.1 System update

```bash
sudo apt-get update && sudo apt-get upgrade -y
```

### 3.2 Install Node.js 20 LTS

Ubuntu's apt-provided `nodejs` package is outdated — install from NodeSource instead:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should print v20.x or newer
```

### 3.3 Install MongoDB

```bash
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod
```

MongoDB binds to `127.0.0.1` by default, which is correct for this setup (the API is the only
client, on the same host). For production hardening, also enable
[MongoDB authentication](https://www.mongodb.com/docs/manual/tutorial/enable-authentication/)
and reference the resulting credentials in `MONGODB_URI` below — no application code changes are
needed for that.

### 3.4 Install git and clone the repository

```bash
sudo apt-get install -y git
git clone <repo-url> audit-tool
cd audit-tool
```

### 3.5 Install dependencies and configure environment

```bash
npm install                  # installs all workspaces, builds shared/ via postinstall
cp .env.example server/.env
```

Edit `server/.env`:

```
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/audit-tool
SESSION_SECRET=<generate with: openssl rand -base64 48>
CSRF_SECRET=<generate a different one the same way>
CLIENT_ORIGIN=https://your-domain.example
COOKIE_SECURE=true
SESSION_TTL_HOURS=8
```

### 3.6 Build

```bash
npm run build   # builds shared/, server/dist, and web/dist
```

### 3.7 Run the server as a systemd service

Create `/etc/systemd/system/audit-tool.service`:

```ini
[Unit]
Description=audit-tool API server
After=network.target mongod.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/audit-tool
EnvironmentFile=/opt/audit-tool/server/.env
ExecStart=/usr/bin/node server/dist/server.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

(Place the repository at `/opt/audit-tool`, or adjust `WorkingDirectory`/`ExecStart` to match.)

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now audit-tool
sudo systemctl status audit-tool
```

Alternatively, run it under [pm2](https://pm2.keymetrics.io/) (`npm i -g pm2`, then
`pm2 start server/dist/server.js --name audit-tool` and `pm2 save` + `pm2 startup`).

### 3.8 Serve the web app and reverse-proxy the API with Nginx

```bash
sudo apt-get install -y nginx
```

`/etc/nginx/sites-available/audit-tool`:

```nginx
server {
    listen 80;
    server_name your-domain.example;

    root /opt/audit-tool/web/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/audit-tool /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 3.9 Enable HTTPS

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.example
```

Certbot rewrites the Nginx config for HTTPS and sets up auto-renewal. Once HTTPS is live, confirm
`COOKIE_SECURE=true` in `server/.env` and restart the service.

### 3.10 Lock down the firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

This exposes only SSH, HTTP, and HTTPS — the Node process (port 4000) and MongoDB (port 27017)
stay reachable only from `localhost`.

### 3.11 Verify

```bash
curl https://your-domain.example/api/v1/health
```

Should return `{"status":"ok","database":"connected",...}`.

---

## Local development

```bash
npm run dev          # runs shared (watch build), server (tsx watch), and web (vite) together
npm run dev:server   # server only, http://localhost:4000
npm run dev:web      # web only, http://localhost:5173 (proxies /api to the server)
```

## Quality gates

```bash
npm run typecheck         # strict TS across shared, server, web
npm run test              # server unit+integration tests, web component tests
npm run test:integration  # server integration tests only (spins up an in-memory MongoDB)
npm run test:e2e          # Playwright, requires: npx playwright install chromium --with-deps
```

## Status

Phase 0 (foundation) complete: monorepo scaffold, strict TypeScript, Express app with security
middleware (helmet, CORS, MongoDB-backed sessions, rate limiting), Mongoose connection, and the
Svelte 5 app shell with a light/dark theme system. Auth/RBAC, the audit lifecycle, the scheduling
engine, and role dashboards follow in subsequent phases.
