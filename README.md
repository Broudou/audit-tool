# audit-tool

Enterprise audit management and auditor scheduling platform.

Monorepo (npm workspaces):

- `shared/` — Zod schemas + TypeScript types shared by client and server
- `server/` — Express + TypeScript + Mongoose 8 REST API
- `web/` — Vite 8 + Svelte 5 SPA

## Prerequisites (Ubuntu 24 VPS or any Linux dev machine)

- Node.js 20 LTS or newer. Ubuntu's apt-provided `nodejs` package is usually outdated —
  install via [NodeSource](https://github.com/nodesource/distributions) or `nvm` instead:
  ```
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- MongoDB 7+ (local install, or an Atlas connection string).

## Setup

```
git clone <repo> audit-tool
cd audit-tool
npm install                # installs all workspaces, builds shared/ via postinstall
cp .env.example server/.env
# edit server/.env: set MONGODB_URI, SESSION_SECRET, CSRF_SECRET (generate with `openssl rand -base64 48`)
```

## Development

```
npm run dev          # runs shared (watch build), server (tsx watch), and web (vite) together
npm run dev:server   # server only, http://localhost:4000
npm run dev:web      # web only, http://localhost:5173 (proxies /api to the server)
```

Health check: `GET http://localhost:4000/api/v1/health`

## Quality gates

```
npm run typecheck      # strict TS across shared, server, web
npm run test           # server unit+integration tests, web component tests
npm run test:integration  # server integration tests only (spins up an in-memory MongoDB)
npm run test:e2e       # Playwright, requires: npx playwright install chromium --with-deps
```

## Production build

```
npm run build   # builds shared, server (dist/), and web (dist/)
npm start       # runs the built server (node server/dist/server.js)
```

Serve `web/dist/` as static files (e.g. behind Nginx) and reverse-proxy `/api` to the Express
server. Set `NODE_ENV=production` and `COOKIE_SECURE=true` once served over HTTPS.

## Status

Phase 0 (foundation) complete: monorepo scaffold, strict TypeScript, Express app with
security middleware (helmet, CORS, MongoDB-backed sessions, rate limiting), Mongoose
connection, and the Svelte 5 app shell with a light/dark theme system. See the architecture
plan for the full roadmap — auth/RBAC, audit lifecycle, scheduling engine, and dashboards
follow in subsequent phases.
