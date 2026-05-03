# VisuTek — 3D Product Viewer Platform

Embed interactive 3D product viewers into any Shopify store. Merchants upload their own GLB models, configure colors and size charts, and add the viewer to their product pages via a Shopify Theme App Extension — no code required.

---

## Architecture

```
visutek/
├── apps/
│   ├── backend/        Express API — viewer rendering, uploads, Shopify OAuth
│   ├── admin/          Next.js merchant dashboard
│   └── viewer/         Vite-built Three.js viewer (iframe content)
├── extensions/
│   └── visutek-block/  Shopify Theme App Extension
└── packages/
    └── shared/         Shared TypeScript types + plan definitions
```

**How it works:**

1. Merchants sign up at the admin dashboard, connect their Shopify store via OAuth
2. They create a viewer config, upload GLB models, set colors and size charts
3. The Shopify Theme App Extension adds an `<iframe>` to product pages pointing at `/viewer?config=<id>`
4. The viewer reads its config from the backend, loads the GLB from S3, and sends cart actions back to the parent page via `postMessage`

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (local or hosted)
- AWS S3 bucket or Cloudflare R2 bucket
- Shopify Partner account

---

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example apps/backend/.env
```

Fill in all values. Generate secrets with:
```bash
openssl rand -hex 32  # for JWT_SECRET
openssl rand -hex 32  # for ENCRYPTION_KEY
```

### 3. Database

```bash
cd apps/backend
pnpm db:migrate    # creates tables
pnpm db:generate   # generates Prisma client
```

### 4. Build viewer

```bash
cd apps/viewer
pnpm build
```

This produces `apps/viewer/dist/viewer.iife.js` — the backend serves this as `/viewer.js`.

### 5. Run locally

```bash
# From root — runs all apps in parallel
pnpm dev
```

| App | URL |
|-----|-----|
| Admin dashboard | http://localhost:3000 |
| Backend API | http://localhost:3001 |
| Viewer iframe | http://localhost:3001/viewer?config=\<id\> |

---

## Shopify Setup

### Create a Partner App

1. Go to [partners.shopify.com](https://partners.shopify.com) → Apps → Create app
2. Choose "Custom app" → "Build app manually"
3. Copy your API key and secret into `.env`
4. Set redirect URLs to `http://localhost:3001/auth/shopify/callback` (dev) and your production URL

### Install the Theme App Extension

```bash
# Requires @shopify/cli
npm install -g @shopify/cli@latest
shopify app deploy
```

Merchants then go to Online Store → Themes → Customize → find the "VisuTek 3D Viewer" block.

---

## Deployment

### Backend

Deploy `apps/backend` to any Node.js host (Railway, Render, Fly.io, AWS EC2).

```bash
cd apps/backend
pnpm build
node dist/index.js
```

Required environment variables: see `.env.example`

### Admin Dashboard

Deploy `apps/admin` to Vercel or any Next.js-compatible host.

```bash
cd apps/admin
pnpm build
```

Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.

### Viewer

The viewer bundle (`apps/viewer/dist/viewer.iife.js`) is served as a static file by the backend. Optionally deploy it to a CDN for faster global delivery.

---

## Plans

| Plan | Viewers | Models/viewer | Storage | Branding |
|------|---------|---------------|---------|----------|
| Free | 1 | 2 | 100MB | VisuTek badge |
| Starter ($49/mo) | 3 | 4 | 500MB | VisuTek badge |
| Pro ($149/mo) | Unlimited | 10 | 5GB | Removable |

Billing is handled through Shopify's billing API.

---

## GLB Model Guidelines

- **Recommended max:** 15MB (use [Draco compression](https://google.github.io/draco/))
- **Hard limit:** 50MB
- **Format:** Binary glTF (`.glb`)
- **Tips:** Remove internal geometry, bake textures, use LOD meshes for best performance

To compress a model with Draco:
```bash
npx gltf-transform optimize input.glb output.glb --compress draco
```

---

## Security Notes

- Shopify access tokens are encrypted at rest with AES-256-GCM before database storage
- All admin routes require JWT authentication via `httpOnly` cookies
- Viewer iframe has a strict Content-Security-Policy header
- S3 model files are private; accessed via presigned URLs (1-hour TTL)
- Shopify webhook authenticity is verified via HMAC

---

## License

Proprietary — all rights reserved.
