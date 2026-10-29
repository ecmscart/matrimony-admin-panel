# Production deployment — all three apps

How to build and deploy **matrimony-server** (API), **matrimony-customer** (public site), and **matrimony-admin** (admin panel) together.

| App | Stack | Local port | Default prod port (Docker) | Build output |
|-----|--------|------------|----------------------------|--------------|
| `matrimony-server` | NestJS + MySQL | `4000` | `8080` | `dist/` |
| `matrimony-customer` | Next.js (`output: "standalone"`) | `3000` | `3000` | `.next/standalone` |
| `matrimony-admin` | Next.js (`output: "standalone"`) | `3001` | `8080` | `.next/standalone` |

**Deploy order:** API first → point frontends at the public API URL → deploy customer & admin.

Suggested public URLs (replace with yours):

| Service | Example URL |
|---------|-------------|
| API | `https://api.mahershadi.com` |
| Customer site | `https://mahershadi.com` |
| Admin panel | `https://admin.mahershadi.com` |
| Uploads (static) | `https://maher.mahershadi.com/uploads` |

---

## 1. Prerequisites

- Node.js **20+**
- MySQL **8** reachable from the API host (e.g. Hostinger remote DB)
- Docker (if using containers / Cloud Run)
- Domains + SSL (Cloud Run managed certs, or Nginx/Caddy on a VPS)
- Hostinger FTP + SMTP already configured for uploads and email (see server `.env.production` shape below)

---

## 2. Environment variables

Never commit real secrets. Set them in the host / Cloud Run / secret manager.

### 2.1 Server (`matrimony-server`)

Loaded from `.env.production` when `NODE_ENV=production`, or from the process environment (preferred in Docker/Cloud Run — the server Dockerfile does **not** bake `.env` into the image).

```env
NODE_ENV=production
PORT=4000                    # Cloud Run sets PORT=8080 automatically; listen on process.env.PORT

JWT_ACCESS_SECRET=<strong-random>
JWT_REFRESH_SECRET=<strong-random>

DB_HOST=<mysql-host>         # required — do not leave unset
DB_PORT=3306
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=<database>
DB_SYNC_SCHEMA=false         # never true in production; use migrations

STORAGE_DRIVER=ftp
FTP_HOST=<ftp-host>
FTP_PORT=21
FTP_USER=<ftp-user>
FTP_PASSWORD=<ftp-password>
FTP_SECURE=false
FTP_UPLOAD_DIR=uploads
UPLOADS_PUBLIC_BASE_URL=https://maher.mahershadi.com/uploads

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=<full-mailbox@domain>
SMTP_PASS=<mailbox-password>
SMTP_FROM="Maher Marriage Bureau <noreply@domain>"
```

### 2.2 Customer (`matrimony-customer`)

`NEXT_PUBLIC_*` is baked in at **build** time. Create `.env.production` before `npm run build` / Docker build:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.mahershadi.com/api
```

### 2.3 Admin (`matrimony-admin`)

Same rule — set before build:

```env
NEXT_PUBLIC_API_URL=https://api.mahershadi.com
NEXT_PUBLIC_UPLOADS_BASE_URL=https://maher.mahershadi.com/uploads
```

---

## 3. Database (before first API deploy)

From `matrimony-server` with production DB credentials available:

```bash
# Option A — env already in shell / .env.production
set NODE_ENV=production
npm run typeorm:migration:run

# Option B — point migrations at a specific env file
set ENV_PATH=.env.production
npm run typeorm:migration:run
```

Seed bootstrap admin once (only if needed):

```bash
# Uses seed scripts in package.json — ensure production env is loaded
npm run seed:prod
# Default seed admin (change immediately after login):
#   admin@maher.local / Admin@123
```

Keep `DB_SYNC_SCHEMA=false` in production.

---

## 4. Option A — Google Cloud Run (matches existing Dockerfiles)

Server and admin Dockerfiles target Cloud Run (`PORT=8080`, multi-stage images). Customer image exposes `3000` (Cloud Run still injects `PORT`; you can align the Dockerfile to `8080` if you prefer).

### 4.1 One-time GCP setup

```bash
gcloud auth login
gcloud config set project <PROJECT_ID>
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

gcloud artifacts repositories create matrimony \
  --repository-format=docker \
  --location=asia-south1
```

Image registry prefix:

```text
asia-south1-docker.pkg.dev/<PROJECT_ID>/matrimony
```

### 4.2 Build & push images

**API**

```bash
cd matrimony-server
gcloud builds submit --tag asia-south1-docker.pkg.dev/<PROJECT_ID>/matrimony/api:latest
```

**Admin** (ensure `.env.production` exists with `NEXT_PUBLIC_*` — admin `.dockerignore` keeps `.env.production` for the build)

```bash
cd matrimony-admin
# Write .env.production with production NEXT_PUBLIC_* values first
gcloud builds submit --tag asia-south1-docker.pkg.dev/<PROJECT_ID>/matrimony/admin:latest
```

**Customer**

```bash
cd matrimony-customer
# Write .env.production with NEXT_PUBLIC_API_BASE_URL first
gcloud builds submit --tag asia-south1-docker.pkg.dev/<PROJECT_ID>/matrimony/customer:latest
```

Or build locally and push:

```bash
docker build -t asia-south1-docker.pkg.dev/<PROJECT_ID>/matrimony/api:latest .
docker push asia-south1-docker.pkg.dev/<PROJECT_ID>/matrimony/api:latest
```

### 4.3 Deploy API

```bash
gcloud run deploy matrimony-api \
  --image=asia-south1-docker.pkg.dev/<PROJECT_ID>/matrimony/api:latest \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --set-env-vars="NODE_ENV=production,DB_SYNC_SCHEMA=false,STORAGE_DRIVER=ftp,FTP_PORT=21,FTP_SECURE=false,FTP_UPLOAD_DIR=uploads,SMTP_HOST=smtp.hostinger.com,SMTP_PORT=465" \
  --set-secrets="DB_HOST=db-host:latest,DB_USER=db-user:latest,DB_PASSWORD=db-password:latest,DB_NAME=db-name:latest,JWT_ACCESS_SECRET=jwt-access:latest,JWT_REFRESH_SECRET=jwt-refresh:latest,FTP_HOST=ftp-host:latest,FTP_USER=ftp-user:latest,FTP_PASSWORD=ftp-password:latest,UPLOADS_PUBLIC_BASE_URL=uploads-base:latest,SMTP_USER=smtp-user:latest,SMTP_PASS=smtp-pass:latest,SMTP_FROM=smtp-from:latest"
```

Create those secrets in Secret Manager first (`gcloud secrets create ...`). Simpler alternative: `--set-env-vars` for non-secret values and paste secrets via Cloud Console → Cloud Run → Edit & deploy → Variables & secrets.

Note the service URL, e.g. `https://matrimony-api-xxxxx-as.a.run.app`. Map a custom domain in Cloud Run if desired.

### 4.4 Deploy customer & admin

Rebuild frontends with the **final** API URL in `NEXT_PUBLIC_*`, then:

```bash
gcloud run deploy matrimony-customer \
  --image=asia-south1-docker.pkg.dev/<PROJECT_ID>/matrimony/customer:latest \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi

gcloud run deploy matrimony-admin \
  --image=asia-south1-docker.pkg.dev/<PROJECT_ID>/matrimony/admin:latest \
  --region=asia-south1 \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi
```

Map custom domains for each service.

**Important:** Changing the API URL later requires **rebuilding** customer and admin images (public env vars are compile-time).

---

## 5. Option B — VPS / Node host (PM2, no Docker)

Useful on a Hostinger VPS or any Linux server with Node 20.

### 5.1 Server

```bash
cd /var/www/matrimony-server
git pull
npm ci --legacy-peer-deps
# Place production secrets in .env.production (or export them)
npm run build
npm run typeorm:migration:run   # with production env loaded

# PM2
pm2 start dist/main.js --name matrimony-api --env production
# Or: NODE_ENV=production pm2 start npm --name matrimony-api -- run start:prod
pm2 save
```

Ensure `.env.production` is present on the server (Nest loads `.env.${NODE_ENV}`).

### 5.2 Customer

```bash
cd /var/www/matrimony-customer
# .env.production with NEXT_PUBLIC_API_BASE_URL=https://api.../api
npm ci --legacy-peer-deps
npm run build
pm2 start node --name matrimony-customer -- .next/standalone/server.js
# Or: pm2 start npm --name matrimony-customer -- start
```

For standalone, also copy static assets next to the standalone server (same layout as the Dockerfile):

```bash
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cd .next/standalone && PORT=3000 HOSTNAME=0.0.0.0 node server.js
```

### 5.3 Admin

```bash
cd /var/www/matrimony-admin
# .env.production with NEXT_PUBLIC_API_URL + NEXT_PUBLIC_UPLOADS_BASE_URL
npm ci --legacy-peer-deps
npm run build
# standalone same as customer, then:
cd .next/standalone && PORT=3001 HOSTNAME=0.0.0.0 node server.js
```

Package scripts:

| App | Build | Start |
|-----|-------|-------|
| Server | `npm run build` | `npm run start:prod` |
| Customer | `npm run build` | `npm run start` (port 3000) |
| Admin | `npm run build` | `npm run start` (port 3001) |

### 5.4 Reverse proxy (Nginx sketch)

```nginx
# API
server {
  server_name api.mahershadi.com;
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# Customer
server {
  server_name mahershadi.com www.mahershadi.com;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

# Admin
server {
  server_name admin.mahershadi.com;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Then enable SSL (`certbot` or Hostinger SSL).

---

## 6. Option C — Docker on a single VPS

### 6.1 API only (compose already in repo)

`matrimony-server/docker-compose.yml` runs API + MySQL for self-hosted DB. For production using **existing Hostinger MySQL**, run only the API image and pass Hostinger DB env vars (do not start the compose MySQL service).

```bash
cd matrimony-server
docker build -t matrimony-api .
docker run -d --name matrimony-api -p 4000:8080 \
  --env-file .env.production \
  -e PORT=8080 \
  matrimony-api
```

### 6.2 Frontends

```bash
cd matrimony-customer
# .env.production present
docker build -t matrimony-customer .
docker run -d --name matrimony-customer -p 3000:3000 matrimony-customer

cd matrimony-admin
docker build -t matrimony-admin .
docker run -d --name matrimony-admin -p 3001:8080 -e PORT=8080 matrimony-admin
```

Put Nginx/Caddy in front for HTTPS and hostnames.

---

## 7. Local production build smoke test

Useful before pushing images.

```bash
# Server
cd matrimony-server
npm ci --legacy-peer-deps
npm run build
npm run start:prod:local    # builds + runs with --env-file=.env.production

# Customer
cd matrimony-customer
echo NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api > .env.production
npm ci --legacy-peer-deps
npm run build
npm run start

# Admin
cd matrimony-admin
# .env.production with NEXT_PUBLIC_API_URL=http://localhost:4000
npm ci --legacy-peer-deps
npm run build
npm run start               # port 3001
```

Checks:

- API Swagger: `http://localhost:4000/api/docs`
- Customer loads profiles from API
- Admin login: `POST /api/auth/admin/login`
- Image upload returns a URL under `UPLOADS_PUBLIC_BASE_URL`

---

## 8. Post-deploy checklist

1. `GET https://api…/api/docs` loads Swagger.
2. Customer signup/login against production API.
3. Admin login on admin domain (admin accounts ≠ website users).
4. Upload a profile image → file appears on FTP host → public URL works in browser.
5. OTP / password-reset email arrives (SMTP).
6. `DB_SYNC_SCHEMA` is `false`; schema only changes via migrations.
7. JWT secrets are unique strong values (not the placeholder strings).
8. Frontends were built with the **production** API URL (not `localhost`).
9. CORS: API uses `origin: true`; ensure browsers hit HTTPS consistently (no mixed content).

---

## 9. Redeploy / update flow

1. Run new migrations on production DB if any.
2. Rebuild & redeploy **server**.
3. If API public URL changed, update frontend `.env.production` and **rebuild** customer + admin.
4. Redeploy customer and admin.
5. Smoke-test login, list profiles, upload, admin moderation.

---

## 10. Quick reference — build & start commands

```bash
# matrimony-server
npm ci --legacy-peer-deps && npm run build && npm run start:prod

# matrimony-customer
npm ci --legacy-peer-deps && npm run build && npm run start

# matrimony-admin
npm ci --legacy-peer-deps && npm run build && npm run start
```

Docker (from each repo root):

```bash
docker build -t <image> .
docker run --env-file .env.production -p <host-port>:<container-port> <image>
```

---

## Related docs

- API reference: [`BACKEND.md`](./BACKEND.md) (same file exists under customer/admin `docs/` copies)
- Storage / FTP behavior: `BACKEND.md` §2 and §8
