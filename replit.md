# Almera E-Commerce Store

## Overview

Full-stack Pakistani clothing e-commerce store built with React + Vite (frontend) and Express + Node.js (backend), using PostgreSQL for data storage.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 18 + Vite + TailwindCSS + shadcn/ui + framer-motion
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Session-based (express-session + bcryptjs) — fully portable
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (API server), Vite (frontend)

## Structure

```text
almera-monorepo/
├── artifacts/
│   ├── almera/          # React + Vite frontend (served at /)
│   └── api-server/      # Express API server (served at /api)
├── lib/
│   ├── api-spec/        # OpenAPI spec + Orval codegen config
│   ├── api-client-react/# Generated React Query hooks
│   ├── api-zod/         # Generated Zod schemas
│   └── db/              # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts      # Database seed script
└── ...
```

## Pages

- `/` — Homepage (hero, categories, featured products, real reviews only)
- `/shop` — Full product catalog with category filter & sort
- `/product/:slug` — Product detail with variant selector + customer review form
- `/auth` — Login / Register
- `/checkout` — Checkout form (COD, Easypaisa, Bank Transfer)
- `/track-order` — Order tracking by order number or phone
- `/account` — Customer portal (orders, saved addresses, write reviews for purchases, profile)
- `/legal/:slug` — Legal pages (terms, privacy, refund)
- `/admin` — Admin panel (Dashboard with period stats, Orders + proof viewer, Products CRUD, Reviews + fake review tool, Users CRUD, Settings, Legal)

## Admin Access

Default admin: `admin@almera.pk` / `admin123`
**Change this password after first login via the Auth page.**

## First-Run Setup (Required on Fresh Environment)

```bash
# 1. Install all dependencies
pnpm install

# 2. Push the DB schema (creates all tables)
pnpm --filter @workspace/db run push

# 3. Seed the database (admin user, products, settings)
pnpm --filter @workspace/scripts run seed
```

## Key Commands

```bash
# Push DB schema changes (after schema edits)
pnpm --filter @workspace/db run push

# Re-seed database (adds admin + sample data)
pnpm --filter @workspace/scripts run seed

# Regenerate API client from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

## Environment Variables Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret key for session cookies (min 32 chars) |

## VPS Deployment

This app is fully self-contained and portable. No Replit-specific services are used.

### Requirements
- Node.js 20+
- PostgreSQL 14+
- pnpm (`npm install -g pnpm`)
- A reverse proxy (nginx/caddy) to serve both frontend and API

### Steps

1. **Clone your repo** to the VPS
2. **Install dependencies**: `pnpm install`
3. **Set environment variables** in a `.env` file or system environment:
   ```
   DATABASE_URL=postgresql://user:pass@localhost:5432/almera
   SESSION_SECRET=your-long-random-secret-at-least-32-chars
   NODE_ENV=production
   PORT=3001
   ```
4. **Push DB schema**: `pnpm --filter @workspace/db run push`
5. **Seed the database** (first time only): `pnpm --filter @workspace/scripts run seed`
6. **Build the frontend**: `pnpm --filter @workspace/almera run build` (outputs to `artifacts/almera/dist/`)
7. **Build the API server**: `pnpm --filter @workspace/api-server run build` (outputs to `artifacts/api-server/dist/`)
8. **Run the API server**: `node artifacts/api-server/dist/index.mjs`
9. **Configure nginx** to:
   - Serve `artifacts/almera/dist/` as static files for `GET /*`
   - Proxy `/api/*` to `localhost:PORT`
   - Add `try_files $uri /index.html;` for SPA routing

### Example nginx config

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/almera-monorepo/artifacts/almera/dist;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cookie_flags ~ Secure SameSite=None; # for HTTPS
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Upload storage

Payment screenshots and product images are stored in an `uploads/` directory next to where you run the API server. Set `UPLOADS_DIR=/var/www/almera/uploads` to customize.

### Process management (production)

Use PM2 or systemd to keep the API server running:

```bash
npm install -g pm2
pm2 start "node artifacts/api-server/dist/index.mjs" --name almera-api
pm2 save
pm2 startup
```
