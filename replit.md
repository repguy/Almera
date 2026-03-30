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

## Deployment

---

### Option A — Replit (Easiest)

1. Make sure both workflows are running and the app looks correct in the preview.
2. Click **Deploy** (the Publish button) in the Replit toolbar.
3. Replit will build the project and host it on a `.replit.app` subdomain (or your custom domain).
4. Set the required secrets in **Replit Secrets** before deploying:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `SESSION_SECRET` — a random string of at least 32 characters

> The production database is separate from the development one. After first deploy, run the schema push and seed from the Replit shell targeting the production `DATABASE_URL`.

---

### Option B — VPS / Dedicated Server

This app is fully self-contained and portable. No Replit-specific services are used.

#### Server requirements

| Requirement | Minimum |
|---|---|
| OS | Ubuntu 22.04+ / Debian 12+ |
| Node.js | 20 LTS or newer |
| PostgreSQL | 14+ |
| RAM | 1 GB (2 GB recommended) |
| Package manager | pnpm (install via `npm install -g pnpm`) |
| Reverse proxy | nginx or Caddy |

#### Step 1 — Clone and install

```bash
git clone <your-repo-url> /var/www/almera
cd /var/www/almera
pnpm install
```

#### Step 2 — Set environment variables

Create `/var/www/almera/.env`:

```env
DATABASE_URL=postgresql://almera_user:strongpassword@localhost:5432/almera
SESSION_SECRET=replace-with-a-random-64-char-string-generated-by-openssl
NODE_ENV=production
PORT=3001
UPLOADS_DIR=/var/www/almera/uploads
```

Generate a strong session secret:

```bash
openssl rand -hex 32
```

#### Step 3 — Prepare the database (first time only)

```bash
# Create the PostgreSQL database and user
sudo -u postgres psql -c "CREATE USER almera_user WITH PASSWORD 'strongpassword';"
sudo -u postgres psql -c "CREATE DATABASE almera OWNER almera_user;"

# Push the schema
pnpm --filter @workspace/db run push

# Seed with admin account + sample data
pnpm --filter @workspace/scripts run seed
```

> Change the admin password immediately after first login at `/auth`.

#### Step 4 — Build for production

```bash
# Build the React frontend (outputs to artifacts/almera/dist/)
pnpm --filter @workspace/almera run build

# Build the API server (outputs to artifacts/api-server/dist/)
pnpm --filter @workspace/api-server run build
```

#### Step 5 — Run with PM2

```bash
npm install -g pm2

# Start the API server
pm2 start "node --env-file=.env artifacts/api-server/dist/index.mjs" --name almera-api

# Save process list and enable auto-restart on reboot
pm2 save
pm2 startup
```

#### Step 6 — Configure nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP → HTTPS (after you set up SSL below)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL — managed by Certbot (see below)
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Serve the built React frontend
    root /var/www/almera/artifacts/almera/dist;
    index index.html;

    # Increase upload limit for product images and payment screenshots
    client_max_body_size 25M;

    # Proxy API requests to the Express server
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # SPA fallback — send all non-file requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Test and reload nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

#### Step 7 — Free SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Auto-renewal is set up automatically
```

---

### Upload storage

Product images and payment screenshots are stored on disk. The default location is an `uploads/` folder next to where the API is run. Override it with the `UPLOADS_DIR` environment variable:

```env
UPLOADS_DIR=/var/www/almera/uploads
```

Make sure the directory exists and is writable:

```bash
mkdir -p /var/www/almera/uploads
chown -R www-data:www-data /var/www/almera/uploads
```

Back up this folder regularly alongside the database.

---

### Database backup

```bash
# Dump
pg_dump -U almera_user almera > backup_$(date +%Y%m%d).sql

# Restore
psql -U almera_user almera < backup_20260101.sql
```

Set up a daily cron job:

```bash
crontab -e
# Add:
0 2 * * * pg_dump -U almera_user almera > /var/backups/almera/almera_$(date +\%Y\%m\%d).sql
```

---

### Updating the app

```bash
cd /var/www/almera
git pull
pnpm install

# If DB schema changed:
pnpm --filter @workspace/db run push

# Rebuild
pnpm --filter @workspace/almera run build
pnpm --filter @workspace/api-server run build

# Restart the API
pm2 restart almera-api
```

---

### Troubleshooting

| Symptom | Fix |
|---|---|
| Login returns 500 | Run `pnpm --filter @workspace/db run push` then `seed` — tables missing |
| Products not showing | Database not seeded — run `pnpm --filter @workspace/scripts run seed` |
| Images not loading | Check `UPLOADS_DIR` path exists and is readable by the process |
| Session lost on every request | `SESSION_SECRET` must be set and consistent across restarts |
| nginx 502 Bad Gateway | API server is not running — check `pm2 status almera-api` |
| CORS errors in browser | Ensure `NODE_ENV=production` is set on the server |
