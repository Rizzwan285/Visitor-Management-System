# Phase 0 — Scaffold Complete ✅

## Overview

Phase 0 scaffold is done. Tasks 0.1 and 0.2 (Next.js init + dependency install) were completed by Claude Code. Tasks 0.3–0.6 were completed in this session.

---

## What Was Built

### Task 0.3 — Directory Structure & Config Files

Created all project directories with `.gitkeep` files:
`src/components/{ui,forms,passes,scanner,dashboard,layout}`, `src/services/`, `src/schemas/`, `src/hooks/`, `src/stores/`, `tests/{unit,integration}/`, `public/uploads/`, `public/assets/`, `src/lib/email-templates/`

Key files created:
- `src/config/domains.ts` — `isAllowedEmail()` function; maps `@iitpkd.ac.in` → EMPLOYEE, `@smail.iitpkd.ac.in` → STUDENT, whitelisted → OFFICIAL
- `src/config/feature-flags.ts` — env-controlled flags for approval requirements
- `src/config/email-config.ts` — email CC config (assistant warden, dept heads)
- `src/lib/prisma.ts` — PrismaClient singleton using `@prisma/adapter-pg` (Prisma v7 required)
- `src/types/api.types.ts` — `ApiResponse<T>`, `PaginatedResult<T>`, `ApiError`, `successResponse()`, `errorResponse()` helpers
- `src/types/pass.types.ts` — `CreatePassInput`, `UpdatePassInput`, `PassFilters`
- `src/types/user.types.ts` — `UserProfile`, `SessionUser`
- `.env.example` — all env variable keys with comments

### Task 0.4 — Prisma Schema, Migration & Seed

- `prisma/schema.prisma` — 7 models (`User`, `VisitorPass`, `ApprovalRequest`, `ScanLog`, `EmailLog`, `AuditLog`, `FeatureFlag`), 6 enums (`Role`, `PassType`, `PassStatus`, `ApprovalStatus`, `ScanType`, `Sex`), all snake_case mapped, proper indexes
- `prisma.config.ts` — Prisma v7 config (datasource URL moved here from schema)
- `prisma/seed.ts` — seeds 5 users (one per role), 2 feature flags, 3 sample passes
- `package.json` updated — added `"prisma": { "seed": "ts-node ..." }` config
- Prisma client generated → `src/generated/prisma/`

### Task 0.5 — Shared Utilities

- `src/lib/qr.ts` — `generateQRPayload()` (HMAC-SHA256), `verifyQRPayload()`, `generateQRCodeDataURL()` (base64 PNG)
- `src/lib/id-generator.ts` — `generateUniqueId()` (10-digit), `generatePassNumber()` (`VMS-YYYYMMDD-XXXX`)
- `src/schemas/pass.schema.ts` — Zod v4 discriminated union over 5 pass types + `passFiltersSchema`
- `src/schemas/scan.schema.ts` — scan input validation (ENTRY/EXIT + optional fields)
- `src/schemas/user.schema.ts` — credentials login validation

### Task 0.6 — NextAuth & RBAC Middleware

- `src/lib/auth.ts` — NextAuth v5 config: Google OAuth (domain-checked), Credentials (for SECURITY role); JWT/session callbacks expose `role`, `uniqueId`, `rollNumber`
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth route handler
- `src/middleware.ts` — page-level RBAC: `/employee` → EMPLOYEE/ADMIN, `/student` → STUDENT/ADMIN, `/official` → OFFICIAL/ADMIN, `/security` → SECURITY/ADMIN, `/admin` → ADMIN only
- `src/lib/api-middleware.ts` — `withAuth()`, `withRole()`, `withValidation()` composable API route wrappers
- `src/lib/auth-utils.ts` — `getCurrentUser()`, `requireAuth()`, `requireRole()` for server components

---

## Critical Prisma v7 Notes

> **Prisma 7.4.2 has major breaking changes from v6.** All future agents must know:

| What | v6 (old) | v7 (current) |
|------|----------|--------------|
| Generator | `prisma-client-js` | `prisma-client` |
| Output path | auto into `node_modules` | explicit: `../src/generated/prisma` |
| Datasource URL | `url = env("DATABASE_URL")` in schema | `prisma.config.ts` file |
| Client instantiation | `new PrismaClient()` | requires driver adapter: `new PrismaClient({ adapter: new PrismaPg({...}) })` |
| Import path | `@prisma/client` | `@/generated/prisma/client` |
| `.env` loading | automatic | **NOT automatic** — must use `dotenv` or set env manually |

---

## Verification

- ✅ `npx prisma generate` — client generated to `src/generated/prisma/`
- ✅ `npx tsc --noEmit` — **zero TypeScript errors**

---

## Before Starting Phase 1 or 2

1. Copy `.env.example` → `.env.local` and fill in:
   - `DATABASE_URL` — local PostgreSQL connection string
   - `NEXTAUTH_SECRET` — any random string (e.g. `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
   - `QR_HMAC_SECRET` — any random string
2. Run: `npx prisma migrate dev --name init`
3. Run: `npx prisma db seed`
4. Run: `npm run dev` — should start on `localhost:3000`

---

## Phase Status

| Phase | Status |
|-------|--------|
| Phase 0 — Scaffold | ✅ Complete |
| Phase 1 — Backend | ⏳ Ready to start |
| Phase 2 — Frontend | ⏳ Ready to start (can run parallel with Phase 1) |
| Phase 3 — Integration | ⏳ After 1 & 2 |
| Phase 4 — Local Deployment | ⏳ Last |