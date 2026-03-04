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
| Phase 1 — Backend | ✅ Complete |
| Phase 2 — Frontend | ✅ Complete |
| Phase 3 — Integration | ✅ Complete |
| Phase 4 — Local Deployment | ✅ Complete |

---

## Phase 3 & 4 — Integration & Local Deployment

In Phase 3 and Phase 4, the application was tested end-to-end to ensure that all workflows function simultaneously and efficiently on the backend.

### What Was Built
- **End-to-End Wiring**: Replaced mocked React Query API calls with actual integrated services. Verified all 5 workflows functioning correctly with real database entries.
- **Repository Setup**: Initialized and updated all `package.json` scripts, installing required dependencies.
- **Documentation**: Rewrote the global documentation in `README.md` to detail instructions for cloning the repo, deploying the PostgreSQL docker instance, migrating/resetting the Database, seeding mock users/data, and booting up the `localhost:3000` test server.
- **Error Checks**: Addressed all major Next.js `useEffect` / async routing bugs and successfully passed a clean `tsc --noEmit` and `npm run build` command checks.

---

## Phase 2 — Frontend UI & Dashboards


In Phase 2, we built out the complete frontend interface for the Visitor Management System using Next.js App Router, Tailwind CSS, Shadcn Components, and React Query for asynchronous data fetching.

### What Was Built
- **Authentication Pages**: Created a responsive two-column Login view featuring OAuth buttons and a fallback credentials form for Security Staff.
- **Role-Based Layouts**: Implemented the main dashboard layout with a collapsible Next.js-aware sidebar, contextual header, and session-based navigation links.
- **Personalized Dashboards**: Built specific overview dashboards for `/employee`, `/student`, `/official`, `/security`, and `/admin`. Each dashboard features a `StatsCards` widget dynamically fetching user-scoped statistics and a `RecentActivity` table.
- **Pass Creation Forms**: Implemented 5 complete workflows for pass generation:
  - Employee Guest Pass Form
  - Official Guest Pass Form
  - **Student Guest Pass Form** (includes faculty approver selection fields and notices).
  - **Walk-in Pass Form** (features a live HTML5 WebRTC webcam integration so security can capture visitor photos on-site).
  - **Student Exit Pass Form** (self-requested validation mapping to host hostels).
- **Pass Verification & Details**:
  - `PassDetail` view displaying full payload metadata.
  - `PassQRCode` generator.
  - `@media print` CSS utility and a `PassPrintLayout` component that enables physical pass generation complete with signature blocks and standard print formatting.
- **QR Scanner & Approvals**: 
  - Integrated `html5-qrcode` to allow Security to continuously scan passes using phone/tablet cameras. The `ScanResultModal` immediately parses backend results and allows quick "Log Entry" or "Log Exit" actions.
  - `AdminApprovalsPage` featuring specialized `ApprovalCard` widgets for administrators or faculty to swiftly approve or reject pending requests.

### Technical Achievements
- Eliminated all static rendering export issues (like wrapping Next 15 `useSearchParams` in `<Suspense>`).
- Completely resolved the mismatched `Promise<Params>` breaking typings from Next.js 15 Route Handlers generated in Phase 1's API middlewares.
- Added comprehensive frontend data types that fulfill empty relations returned from Prisma limits in the mock backend schemas.
- Completed a successful `npm run build` with zero TypeScript or edge-runtime compilation errors.