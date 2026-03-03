# Phase 1 Backend Builder — Memory

## Project: IIT Palakkad Visitor Management System
Working directory: `C:\Users\muham\Documents\Visitor_Management_System`

## Tech Stack
- Next.js 14 App Router + TypeScript
- Prisma v7.4.2 with `@prisma/adapter-pg` (NOT standard PrismaClient — needs adapter)
- Import Prisma from `@/generated/prisma/client` (NOT `@prisma/client`)
- Zod v4 — import from `zod/v4` (NOT `zod`)
- NextAuth v5
- Resend for email

## Critical Prisma v7 Facts
- Client import: `@/generated/prisma/client`
- Instantiation: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
- Prisma namespace: `import type { Prisma } from '@/generated/prisma/client'`
- `Prisma.InputJsonValue` needed for Json field assignments
- No automatic `.env` loading — use `dotenv` or set env manually

## Key File Locations
- `src/lib/prisma.ts` — PrismaClient singleton
- `src/lib/auth.ts` — NextAuth v5 config
- `src/lib/api-middleware.ts` — `withAuth`, `withRole`, `withValidation` wrappers
- `src/lib/qr.ts` — QR payload generation and verification
- `src/lib/id-generator.ts` — `generatePassNumber()`, `generateUniqueId()`
- `src/lib/qr-and-id.ts` — re-exports from both qr.ts and id-generator.ts
- `src/lib/email.ts` — Resend client singleton
- `src/config/feature-flags.ts` — approval feature flags
- `src/config/email-config.ts` — email CC config (asst warden, dept heads)
- `src/types/api.types.ts` — `successResponse()`, `errorResponse()`, pagination types
- `src/schemas/pass.schema.ts` — Zod discriminated union for all 5 pass types
- `src/schemas/scan.schema.ts` — `scanInputSchema`

## Phase 1 Services Built
- `src/services/audit.service.ts` — `AuditService.log()`, non-blocking, never throws
- `src/services/email.service.ts` — `EmailService.sendPassEmail()`, `sendApprovalRequestEmail()`, non-blocking
- `src/services/pass.service.ts` — `createPass`, `getPassById`, `listPasses`, `updatePass`, `cancelPass`
- `src/services/approval.service.ts` — `getPendingApprovals`, `approvePass`, `rejectPass`
- `src/services/scan.service.ts` — `verifyAndGetPass`, `logScan`, `getScanHistory`, `getRecentScans`

## Phase 1 API Routes Built
- `POST/GET /api/passes` — create + list (role-scoped)
- `GET/PATCH/DELETE /api/passes/[id]` — detail, update, cancel
- `POST /api/passes/[id]/approve` — ADMIN only approve/reject
- `POST /api/passes/[id]/scan` — SECURITY only scan log
- `GET /api/passes/verify?code=` — QR verification (SECURITY/ADMIN)
- `GET /api/users` — list users (filterable by role)
- `GET /api/users/me` — current user profile
- `POST /api/upload/photo` — SECURITY only photo upload (multipart)
- `GET /api/scan-logs` — paginated scan history (SECURITY/ADMIN)
- `GET /api/dashboard` — role-scoped stats

## API Middleware Pattern
```ts
// withAuth wraps to AuthenticatedHandler (adds req.auth.user)
// withRole takes string[], handler → AuthenticatedHandler
// withValidation takes Zod schema, handler (with validatedData) → AuthenticatedHandler
// Context params accessed as: context?.params?.id (Record<string, string> NOT Promise)
```

## Response Pattern
Always return: `successResponse(data, meta?)` or `errorResponse(code, message, details?)`
Wrapped in `NextResponse.json(...)` with explicit status code.

## Email Templates
All in `src/lib/email-templates/` as `.tsx` files exporting `renderXxxEmail(props): string`.
Templates: employee-guest, official-pass, student-guest, walkin-pass, student-exit, approval-request.

## Audit Actions
`PASS_CREATED | PASS_UPDATED | PASS_CANCELLED | PASS_APPROVED | PASS_REJECTED | SCAN_ENTRY | SCAN_EXIT | USER_LOGIN`

## Pass Status Flow
- EMPLOYEE_GUEST / OFFICIAL / WALKIN / STUDENT_EXIT → ACTIVE immediately
- STUDENT_GUEST → PENDING_APPROVAL + creates ApprovalRequest (transactional)
- Feature flags can override approval requirement for EMPLOYEE_GUEST and OFFICIAL

## Phase Status
- Phase 0 (Scaffold): Complete
- Phase 1 (Backend): Complete — all services + API routes
- Phase 2 (Frontend): Not started
