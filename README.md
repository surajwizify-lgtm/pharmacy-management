# Pharmacy POS — Next.js 14 (App Router)

Full-stack conversion of the pharmacy management system:

`MedicPOS (Spring Boot 3.2 + Angular)` → `pharmacy-nest (NestJS + Prisma)` → **this (Next.js 14, App Router)**

GST-compliant billing (CGST/SGST/IGST split), batch/expiry inventory with FIFO
sale allocation, optimistic-locking stock adjustments, and role-based access
(ADMIN / PHARMACIST / CASHIER) — all ported 1:1 from the NestJS version's
business logic, now running as a single Next.js app (API routes + React UI)
instead of a separate API + Angular frontend.

## Stack

- **Next.js 14** App Router — API routes replace NestJS controllers/services
- **NextAuth.js v4** (Credentials provider, JWT session) — replaces
  `@nestjs/passport` + hand-rolled JWT strategy
- **Prisma + PostgreSQL** — same schema as the NestJS version, unchanged
- **Zod** — replaces `class-validator` DTOs
- **Tailwind CSS** — hand-built UI (dashboard, medicines, batches, billing/POS, users)
- **decimal.js** — same GST math as the NestJS version (money handled as
  Decimal, never float)

## What ported 1:1 vs. what changed

| NestJS concept | Next.js equivalent |
|---|---|
| Controllers + Services | `src/app/api/**/route.ts` route handlers |
| `class-validator` DTOs | `src/lib/schemas.ts` (Zod) |
| `JwtAuthGuard` + `RolesGuard` + `@Roles()` | `requireSession(allowedRoles)` in `src/lib/api-utils.ts`, called at the top of each route handler |
| `@nestjs/jwt` + `passport-jwt` | NextAuth.js Credentials provider (`src/lib/auth.ts`), same bcrypt check, JWT session cookie instead of a bearer token |
| `PrismaService` (injectable) | `src/lib/prisma.ts` singleton (dev-mode hot-reload safe) |
| Swagger (`/api/docs`) | Not ported — see "Not included" below |
| Angular frontend | New React/Tailwind frontend under `src/app/(app)/**` |

The **billing GST logic** (`src/lib/billing.ts`) is a near-verbatim port of
`BillingService.createBill()`: FIFO batch resolution, CGST+SGST vs IGST split,
optimistic-locking stock deduction inside a single Prisma `$transaction`,
sequential `BILL-YYYYMMDD-NNNN` numbering.

## Project structure

```
prisma/schema.prisma        Same schema as pharmacy-nest, unchanged
prisma/seed.ts               Same seed data (admin/pharmacist users, 2 medicines)
src/lib/
  prisma.ts                  Prisma client singleton
  auth.ts                    NextAuth config (Credentials provider)
  api-utils.ts                requireSession() RBAC guard + ApiError + withErrorHandling()
  schemas.ts                  Zod validation schemas (was class-validator DTOs)
  billing.ts                  createBill() - GST split + FIFO + optimistic locking
  api-client.ts                Client-side fetch wrapper for calling our own API
src/middleware.ts             Page-level auth guard (redirects to /login, blocks /users for non-admins)
src/app/api/**                API routes (one folder per NestJS controller)
src/app/(app)/**              Protected pages: dashboard, medicines, batches, billing, users
src/app/login/                Sign-in page
```

## API endpoints (unchanged paths/behavior from the NestJS version)

| Method | Path | Roles |
|---|---|---|
| POST | `/api/auth/[...nextauth]` (sign-in via NextAuth, not a raw `/auth/login` POST) | public |
| GET/POST | `/api/users` | ADMIN |
| PATCH | `/api/users/:id/deactivate` | ADMIN |
| GET/POST | `/api/medicines` | any / ADMIN+PHARMACIST |
| GET | `/api/medicines/low-stock?threshold=` | any |
| GET | `/api/medicines/expiring-soon?days=` | any |
| GET | `/api/medicines/barcode/:barcode` | any |
| GET/PUT/DELETE | `/api/medicines/:id` | any / ADMIN+PHARMACIST / ADMIN |
| GET/POST | `/api/batches` | any / ADMIN+PHARMACIST |
| GET | `/api/batches/:id` | any |
| PATCH | `/api/batches/:id/stock` | ADMIN+PHARMACIST |
| GET/POST | `/api/bills` | any / ADMIN+PHARMACIST+CASHIER |
| GET | `/api/bills/:id` | any |
| POST | `/api/bills/:id/payments` | ADMIN+PHARMACIST+CASHIER |

## Setup

```bash
npm install
cp .env.example .env      # set DATABASE_URL and a real NEXTAUTH_SECRET
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Generate a secret for `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

Seeded accounts (same as the NestJS version):

- `admin` / `Admin@123` (ADMIN)
- `pharmacist` / `Pharma@123` (PHARMACIST)

There's no seeded CASHIER — create one from the Users page while logged in as admin.

## Not included / left for you

- **Swagger/OpenAPI docs** — not ported. If you want API docs, either hand-write
  an OpenAPI spec or add a tool like `next-swagger-doc`.
- **Rate limiting** (`@nestjs/throttler` in the old app) — add via middleware
  (e.g. `@upstash/ratelimit`) or at the reverse-proxy layer if you need it.
- **PDF invoice generation** (`pdfmake` was a dependency in the NestJS
  `package.json` but wasn't wired into any controller in the source you
  uploaded) — not implemented here either. The bill detail page has all the
  data needed (line items, GST split, totals) if you want to add a "Print" /
  PDF export button.
- **Returns** (`Return` / `ReturnItem` models exist in the Prisma schema but
  had no corresponding NestJS module in your upload) — not implemented here
  either, for the same reason: nothing to port from.
- **Audit log** (`AuditLog` model exists in the schema, unused in the source)
  — same story.

## Notes on the auth approach

NextAuth's Credentials provider stores its session as a signed JWT in an
httpOnly cookie rather than a bearer token you attach manually — that's
NextAuth's standard model and is intentional here. Server components and API
routes read it via `getServerSession(authOptions)` / `requireSession()`;
client components read it via `useSession()`. If you later want a mobile app
or third-party API consumers hitting `/api/*` with a bearer token instead of
a cookie, that's a separate concern from the web UI and would need a second
auth path (e.g. NextAuth's JWT can still be verified manually from an
`Authorization` header if you add that).
