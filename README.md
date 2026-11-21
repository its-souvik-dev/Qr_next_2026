# Max QR

A QR code generator and URL shortener built with Next.js.

- **Static QR codes.** The real content (URL, Wi-Fi, vCard and so on) is encoded into the symbol itself. Codes keep working forever, with no redirect server and no subscription.
- **Design studio.** Real-time preview, 9 dot styles, 5 corner-frame and 5 corner-eye styles, solid colors and linear/radial gradients, transparent or image backgrounds, and 10 logo treatments. A built-in readability check warns about designs that are hard to scan.
- **Export.** PNG, JPG, WebP and SVG, up to 8000 px or by physical size at 150/300/600 DPI (the DPI is written into the file). You can preview the exact file before downloading it. Batch generation produces a ZIP.
- **URL shortener.** Random or custom slugs, editable destinations, expiration dates, password protection, enable/disable, categories and tags, bulk import and CSV export. Redirects happen on the server, and destinations are validated against open-redirect abuse.
- **Privacy-conscious analytics.** Clicks, unique visitors (approximate), daily/weekly/monthly timelines, country, device, browser, OS and referrer. IP addresses are never stored, and you choose how long data is kept.

## Tech stack

Next.js 16 (App Router, Cache Components, Partial Prefetching) · React 19 · TypeScript (strict) · Tailwind CSS 4 · shadcn/ui (Radix) · Lucide · Prisma 7 + PostgreSQL · Zod 4 · React Hook Form · Zustand · `qrcode` (matrix) + a custom SVG renderer · Sharp · Recharts · JSZip · Vitest

Authentication is built in. It uses database-backed sessions, scrypt password hashing and hashed session tokens. This was chosen over Auth.js v5, which is still in beta and doesn't fit Cache Components well. See [Security](#security).

## Accounts (sign-in only)

Public sign-up is disabled: `SIGNUP_ENABLED = false` in [src/config/site.ts](src/config/site.ts). With it off, `/register` redirects to `/login` and the register action rejects calls. The original sign-up page is kept, commented out.

The login account comes from [prisma/seed.ts](prisma/seed.ts).
- **Docker:** the `migrate` container runs the seed automatically.
- **Locally:** run `npm run db:seed`.
- **Defaults:** `SEED_USER_EMAIL`, `SEED_USER_PASSWORD` and `SEED_USER_NAME` override the built-in values.
- **No overwrite:** the seed only creates the user if it doesn't exist, so a password changed in Settings is never reset.

## Getting started

### Run everything in Docker

```bash
cp .env.example .env            # set APP_SECRET and CRON_SECRET (openssl rand -hex 32)
docker compose --profile app up -d --build
# → Postgres + one-shot migrations + the app on http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `docker compose --profile app up -d --build` | Rebuild and start everything (run again after code changes) |
| `docker compose --profile app logs -f app` | Follow app logs |
| `docker compose --profile app down` | Stop everything (data is kept in the `maxqr-pg` volume) |
| `docker compose --profile app down -v` | Stop everything **and delete the database** |
| `docker compose up -d` | Postgres only, for `npm run dev` on your machine |

`NEXT_PUBLIC_APP_URL` is baked into the build. Change it in `.env`, then rebuild with `--build`.

### Run locally with Node

Requirements: Node 20.9+ (tested on Node 24) and PostgreSQL 14+.

```bash
npm install                     # also runs `prisma generate`
cp .env.example .env            # then fill in the values (see below)

# Option A: Docker
docker compose up -d            # Postgres on localhost:5432, matching .env.example

# Option B: zero-install local Postgres from Prisma (PGlite)
npx prisma dev --name max-qr -d # copy the printed postgres:// URL into DATABASE_URL
                                # and set DATABASE_POOL_MAX=1 (single-connection server)

npm run db:migrate              # apply migrations
npm run dev                     # http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `APP_SECRET` | ✅ | 32+ random bytes (`openssl rand -hex 32`). Keys the daily-rotating visitor hash. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL, used to build short links (`https://yourdomain.com/s/abc123`) |
| `CRON_SECRET` | recommended | Bearer token for `/api/cron/cleanup` |
| `DATABASE_POOL_MAX` | optional | Connection pool size per instance (default 10, use 1 with `prisma dev`) |
| `APP_HOSTNAMES` | optional | Extra comma-separated hostnames that serve the app. Any other host is treated as a custom short-link domain. |

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev server / production build / production server |
| `npm test` | Unit tests (QR engine scannability, content encoding, URL safety, date ranges) |
| `npm run typecheck` / `lint` | TypeScript and ESLint |
| `npm run db:migrate` / `db:deploy` / `db:studio` | Prisma migrations (dev / production) and Prisma Studio |

## Architecture

```
prisma/                      schema + migrations (prisma.config.ts at the root)
src/
├── app/
│   ├── (marketing)/         landing, pricing, about (fully static)
│   ├── (auth)/              login, register, forgot/reset password
│   ├── (dashboard)/         dashboard, qr-codes (+create, [id], batch), links (+new, [id]), analytics, settings
│   ├── api/                 qr/render, qr/[id]/image, uploads, links (+[id], export), analytics, auth/session, cron/cleanup
│   ├── s/[slug]/route.ts    server-side redirect (+ /unlock page for password-protected links)
│   └── link-unavailable/    expired / disabled / not found / blocked
├── components/              ui (shadcn), layout, shared, dashboard, qr-customizer, qr-generator, link-shortener, analytics
├── features/                domain modules: qr, links, analytics, auth, settings
│   └── <feature>/           components · hooks · services (server-only data access) · schemas (zod) · types · actions.ts
├── lib/
│   ├── qr/                  the QR engine (pure, isomorphic): config schema, matrix, shapes, renderer, readability, presets, logo styles, raster (Sharp)
│   ├── auth/                crypto (scrypt, token hashing), sessions, data access layer
│   ├── db/                  Prisma client (driver adapter)
│   ├── security/            rate limiter, request helpers
│   └── validations/         shared zod schemas, URL safety, safe redirects
├── stores/                  Zustand store for the QR studio
├── config/                  site + navigation
└── proxy.ts                 optimistic auth redirects + custom-domain routing (Next 16 "proxy", formerly middleware)
```

### QR engine

`src/lib/qr` turns `(content, config)` into an SVG string with no DOM dependency. The same code runs in four places:

- the live studio preview,
- Server Components (thumbnails, marketing),
- Sharp on the server (raster exports with DPI metadata),
- the browser canvas (batch ZIPs).

Module shapes are aware of their neighbors, so adjacent dots fuse into smooth strokes. Alignment patterns are drawn solid for the "disconnected" styles (dots, diamond, bars) so detection stays reliable.

The test suite renders every dot style, every corner combination, all 12 presets and all 10 logo styles. It rasterizes each one with Sharp and decodes it with `jsQR` to prove it scans.

The style config is validated by Zod (`qrStyleSchema`) and stored as JSON on `QRCode.config` and `QRTemplate.config`.

### Data model

`User`, `Session`, `PasswordResetToken`, `QRCode`, `ShortLink`, `LinkClick`, `QRTemplate`, `CustomDomain` and `UserSettings`. Every owned record has a cascade or set-null relation to `User`, plus an index on the owner's query path. The service layer scopes every query by `userId`.

## Security

- **Passwords and link passwords** are hashed with scrypt. Session and reset tokens are stored only as SHA-256 hashes. Cookies are httpOnly, SameSite=Lax and Secure in production. Login takes the same time whether or not the account exists, so response timing doesn't reveal which emails are registered.
- **Authorization** goes through a Data Access Layer (`requireUser`), and every service takes the owner's id. `proxy.ts` only does optimistic redirects. The `?next=` parameter after login only accepts same-site paths.
- **Open-redirect protection.** Destinations must be absolute http(s) URLs. URLs with embedded credentials, private, loopback or link-local hosts, and links pointing at other short links are all rejected. Destinations are checked again at redirect time. Redirects are `302` with `no-store`.
- **Uploads.** The format is detected from the file's bytes, not its name. SVGs with entities or external references are rejected, and every SVG is rasterized. All images are re-encoded (which strips metadata) and downscaled. Nothing is written to disk.
- **Rate limiting** covers login, registration, password reset, link creation, unlock attempts, redirects, uploads, renders and the API.
- **Other protections.** CSV export neutralizes spreadsheet formulas. Security headers are set in `next.config.ts`. Server Actions get Next's built-in origin check.

## Production notes

- **Retention / cleanup.** Call `POST /api/cron/cleanup` once a day with `Authorization: Bearer $CRON_SECRET`, for example from Vercel Cron or any scheduler. Changing the retention period in Settings also purges old data immediately.
- **Rate limiting** uses an in-memory store, which only covers a single instance. When you run several instances, implement the `RateLimitStore` interface in `src/lib/security/rate-limit.ts` on top of Redis/Upstash.
- **Email.** `src/lib/mail` writes messages to the server log. Connect a provider (Resend, Postmark, SES…) in `deliver()` so password-reset emails are actually sent.
- **Country analytics** read the hosting platform's geo header (`x-vercel-ip-country`, `cf-ipcountry`). On other hosts the country is recorded as "Unknown".
- **Custom domains.** Ownership is verified with a DNS TXT record (`_maxqr-verify.<host>`). You also need to point the domain at your deployment (CNAME) and add it to your hosting provider so TLS is issued. Once verified, `go.brand.com/<slug>` is routed to the redirect handler.
- **Unique visitors** are approximate: the visitor hash rotates daily, so a person returning on several days is counted once per day.
# Qr_next_2026
