# IIT Palakkad — Gate Security & Visitor Management System
## Single-Source Execution Plan

> **Version**: 1.0 | **Date**: 2026-03-03 | **Environment**: Local Development  
> **Structure**: 5 Phases × 5 Agents. Each phase is independently executable (Phases 1 & 2 can run in parallel after Phase 0).

---

## Project Overview

A production-quality, full-stack web application for IIT Palakkad campus gate security. It covers:

- **Domain-restricted login** (Google OAuth + Security credentials)
- **5 distinct pass workflows** (Employee Guest, Official, Student Guest, Walk-in, Student Exit)
- **QR code** on every pass, contactless gate scanning with entry/exit logging
- **Approval workflow** for student guest passes (faculty/admin approval required)
- **Security dashboard** for walk-in creation and QR scanning
- **Centralized visitor database** with full audit trail
- **Auto-email** notifications with soft-copy passes

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui |
| State | Zustand (UI) + TanStack Query v5 (server state) |
| Forms | React Hook Form + Zod |
| ORM | Prisma |
| Database | PostgreSQL 15+ |
| Auth | NextAuth.js v5 + Google OAuth + Credentials |
| Email | Resend |
| QR Generate | `qrcode` (server-side, data-URL) |
| QR Scan | `html5-qrcode` (browser camera) |
| PDF/Print | `@react-pdf/renderer` + `@media print` CSS |
| File Storage | Local filesystem (`public/uploads/`) |

### User Roles

| Role | Login Method | Domain/Method |
|------|-------------|--------------|
| EMPLOYEE | Google OAuth | `@iitpkd.ac.in` |
| STUDENT | Google OAuth | `@smail.iitpkd.ac.in` |
| OFFICIAL | Google OAuth | Whitelisted emails (e.g. `personnel@`, `office_cs@`, `IPTIF`, `Techin`) |
| SECURITY | Username + Password | Credentials (seeded accounts) |
| ADMIN | Google OAuth | `@iitpkd.ac.in` + admin flag in DB |

### Pass Types

| ID | Type | Who Creates | Approval | Key Extras |
|----|------|-------------|----------|-----------|
| A | EMPLOYEE_GUEST | Employee | No (flag disabled) | Email to employee |
| B | OFFICIAL | Official account | No (flag disabled) | Email to office + CC dept heads |
| C | STUDENT_GUEST | Student | **REQUIRED** — faculty/admin | Email to student + Asst. Warden + 2 CC |
| D | WALKIN | Security | N/A (phone confirm) | Photo, ID card, signature blocks for print |
| E | STUDENT_EXIT | Student | No | Email to student + CC Asst. Warden; forward button |

### Directory Structure

```
Visitor_Management_System/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   ├── assets/
│   └── uploads/          ← walk-in visitor photos
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── employee/page.tsx
│   │   │   ├── employee/passes/new/page.tsx
│   │   │   ├── employee/passes/[id]/page.tsx
│   │   │   ├── student/page.tsx
│   │   │   ├── student/guest-pass/new/page.tsx
│   │   │   ├── student/exit-pass/new/page.tsx
│   │   │   ├── official/page.tsx
│   │   │   ├── official/passes/new/page.tsx
│   │   │   ├── security/page.tsx
│   │   │   ├── security/scan/page.tsx
│   │   │   ├── security/walkin/new/page.tsx
│   │   │   ├── admin/page.tsx
│   │   │   └── admin/approvals/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── passes/route.ts
│   │   │   ├── passes/[id]/route.ts
│   │   │   ├── passes/[id]/approve/route.ts
│   │   │   ├── passes/[id]/scan/route.ts
│   │   │   ├── passes/verify/route.ts
│   │   │   ├── users/route.ts
│   │   │   ├── users/me/route.ts
│   │   │   ├── upload/photo/route.ts
│   │   │   └── scan-logs/route.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/               ← shadcn primitives
│   │   ├── forms/            ← one form per workflow
│   │   ├── passes/           ← PassDetail, PassCard, PassQRCode, PassPrintLayout
│   │   ├── scanner/          ← QRScanner, ScanResultModal
│   │   ├── dashboard/        ← StatsCards, RecentActivity
│   │   └── layout/           ← Header, Sidebar
│   ├── lib/
│   │   ├── auth.ts           ← NextAuth config
│   │   ├── prisma.ts         ← PrismaClient singleton
│   │   ├── email.ts          ← Resend client
│   │   ├── qr.ts             ← QR payload gen/verify
│   │   ├── id-generator.ts   ← 10-digit ID + pass number
│   │   ├── auth-utils.ts     ← requireAuth, requireRole
│   │   ├── api-middleware.ts ← withAuth, withRole, withValidation
│   │   └── email-templates/  ← one file per pass type
│   ├── services/
│   │   ├── pass.service.ts
│   │   ├── approval.service.ts
│   │   ├── scan.service.ts
│   │   ├── email.service.ts
│   │   └── audit.service.ts
│   ├── schemas/
│   │   ├── pass.schema.ts
│   │   ├── user.schema.ts
│   │   └── scan.schema.ts
│   ├── hooks/
│   │   ├── usePasses.ts
│   │   ├── useApprovals.ts
│   │   └── useScanner.ts
│   ├── stores/ui.store.ts
│   ├── types/
│   │   ├── pass.types.ts
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   ├── config/
│   │   ├── domains.ts
│   │   ├── feature-flags.ts
│   │   └── email-config.ts
│   └── middleware.ts         ← page-level RBAC
└── tests/
    ├── unit/
    └── integration/
```

---

## Database Schema

### Models & Enums

**Enums**:
```prisma
enum Role        { EMPLOYEE STUDENT OFFICIAL SECURITY ADMIN }
enum PassType    { EMPLOYEE_GUEST OFFICIAL STUDENT_GUEST WALKIN STUDENT_EXIT }
enum PassStatus  { DRAFT PENDING_APPROVAL APPROVED REJECTED ACTIVE EXPIRED CANCELLED }
enum ApprovalStatus { PENDING APPROVED REJECTED }
enum ScanType    { ENTRY EXIT }
enum Sex         { MALE FEMALE OTHER }
```

**User model** — `id` (UUID), `email` (unique), `name`, `role`, `rollNumber?` (students), `uniqueId?` (10-digit, non-students), `department?`, `passwordHash?` (security only), `avatarUrl?`, `createdAt`, `updatedAt`, `deletedAt?` (soft delete)

**VisitorPass model** — `id`, `passNumber` (unique, `VMS-YYYYMMDD-XXXX`), `passType`, `status`, `createdById`, `visitorName`, `visitorSex`, `purpose`, `visitFrom`, `visitTo`, `visitorRelation?`, `visitorAge?`, `visitorMobile?`, `visitorIdType?`, `visitorIdNumber?`, `visitorPhotoUrl?`, `phoneConfirmedBy?`, `pointOfContact?`, `hostelName?`, `qrCodeData`, `qrCodeUrl?`, `approvalRequired` (default false), `hostProfessorId?`, `ccEmails?` (JSON), `emailSentTo?` (JSON), `emailSent`, `createdAt`, `updatedAt`, `deletedAt?`

**ApprovalRequest model** — `id`, `passId` (unique FK), `requestedById`, `approverId?`, `status`, `remarks?`, `decidedAt?`, `createdAt`, `updatedAt`

**ScanLog model** — `id`, `passId`, `scannedById`, `scanType`, `scannedAt`, `gateLocation?`, `notes?`

**EmailLog model** — `id`, `passId`, `toAddress`, `ccAddresses?` (JSON), `subject`, `status`, `errorMessage?`, `sentAt`

**AuditLog model** — `id`, `userId?`, `action`, `entityType`, `entityId`, `changes?` (JSON), `ipAddress?`, `createdAt`

**FeatureFlag model** — `id`, `key` (unique), `enabled`, `description?`, `updatedAt`

Indexes on: `passType`, `status`, `createdById`, `hostProfessorId`, `scannedAt`, `entityType+entityId`, `createdAt`

---

## API Contracts

### Standard Response Envelope
```json
{ "success": true, "data": {...}, "meta": { "page": 1, "limit": 20, "total": 142 }, "error": null }
```
```json
{ "success": false, "data": null, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

### Passes API

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/api/passes` | ✅ | ALL | Create pass |
| GET | `/api/passes` | ✅ | ALL | List (role-scoped, paginated) |
| GET | `/api/passes/:id` | ✅ | Owner/Security/Admin | Pass detail |
| PATCH | `/api/passes/:id` | ✅ | Owner | Update |
| DELETE | `/api/passes/:id` | ✅ | Owner/Admin | Cancel (soft) |
| POST | `/api/passes/:id/approve` | ✅ | ADMIN | Approve or reject |
| POST | `/api/passes/:id/scan` | ✅ | SECURITY | Log entry/exit |
| GET | `/api/passes/verify?code=` | ✅ | SECURITY | Verify QR code |

### Other APIs

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/api/users` | ✅ | ALL | List users (filterable by role) |
| GET | `/api/users/me` | ✅ | ALL | Current user profile |
| POST | `/api/upload/photo` | ✅ | SECURITY | Upload walk-in photo |
| GET | `/api/scan-logs` | ✅ | SECURITY/ADMIN | Scan history |

### Request Bodies by Pass Type

**Workflow A (EMPLOYEE_GUEST)**:
```json
{ "passType": "EMPLOYEE_GUEST", "visitorName": "...", "visitorSex": "MALE", "purpose": "...", "visitFrom": "ISO8601", "visitTo": "ISO8601" }
```

**Workflow B (OFFICIAL)** — same as A with `"passType": "OFFICIAL"`

**Workflow C (STUDENT_GUEST)**:
```json
{ "passType": "STUDENT_GUEST", "visitorName": "...", "visitorSex": "FEMALE", "visitorRelation": "Mother", "visitorAge": 52, "purpose": "...", "visitFrom": "ISO8601", "visitTo": "ISO8601", "approverId": "<uuid>" }
```

**Workflow D (WALKIN)**:
```json
{ "passType": "WALKIN", "visitorName": "...", "visitorSex": "MALE", "visitorMobile": "9876543210", "visitorAge": 35, "purpose": "...", "pointOfContact": "Dr. Smith", "phoneConfirmedBy": "Prof. Johnson", "visitorIdType": "Aadhar", "visitorIdNumber": "1234-5678-9012", "visitorPhotoUrl": "/uploads/abc.jpg", "visitFrom": "ISO8601", "visitTo": "ISO8601" }
```

**Workflow E (STUDENT_EXIT)**:
```json
{ "passType": "STUDENT_EXIT", "visitorSex": "MALE", "purpose": "Weekend trip", "hostelName": "Nila Hostel", "visitFrom": "ISO8601", "visitTo": "ISO8601" }
```

**Approve/Reject**:
```json
{ "action": "APPROVE", "remarks": "Approved for campus visit" }
```

**Log Scan**:
```json
{ "scanType": "ENTRY", "gateLocation": "Main Gate", "notes": "" }
```

### QR Code Format
```
VMS:<passId>:<hmac-sha256-truncated>
Example: VMS:a1b2c3d4-e5f6-7890-abcd-ef1234567890:x7k9m2
```
HMAC computed using `QR_HMAC_SECRET` from env. Security dashboard calls `GET /api/passes/verify?code=VMS:...` which validates checksum before returning pass details.

---

## Environment Variables

```env
# .env.local

# PostgreSQL (local)
DATABASE_URL=postgresql://user:password@localhost:5432/vms_db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any-random-secure-string

# Google OAuth (needs Google Cloud project with localhost redirect)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@localhost

# QR Code HMAC
QR_HMAC_SECRET=any-random-secure-string

# File Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
```

---

## Phase 0 — Scaffold (Agent 1)

> **Deliverable**: `npm run dev` starts without errors. DB migrated and seeded. All shared config/utilities importable by other agents.

### Task 0.1 — Initialize Next.js Project

**Files**: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `.eslintrc.json`, `.prettierrc`, `.gitignore`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Steps**:
1. `npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` (non-interactive, works inside existing repo).
2. `npm install -D prettier eslint-config-prettier`.
3. Create `.prettierrc`: `{ "semi": true, "singleQuote": true, "tabWidth": 2 }`.
4. Update `.gitignore`: add `.env.local`, `public/uploads/`.
5. Confirm `npm run dev` starts.
6. Git commit: `"Initialized Next.js 14 project"`.

**Acceptance Criteria**:
- [ ] `npm run dev` starts on `localhost:3000`
- [ ] `npx tsc --noEmit` passes

---

### Task 0.2 — Install All Dependencies

**Steps**:
1. Production:
   ```
   npm install @prisma/client next-auth@5 @auth/prisma-adapter zod react-hook-form @hookform/resolvers zustand @tanstack/react-query qrcode html5-qrcode @react-pdf/renderer resend bcryptjs date-fns uuid
   ```
2. Dev:
   ```
   npm install -D prisma @types/bcryptjs @types/qrcode @types/uuid ts-node
   ```
3. shadcn/ui: `npx -y shadcn@latest init` (Default style, Slate, CSS variables).
4. Git commit: `"Installed all dependencies"`.

**Acceptance Criteria**:
- [ ] `npm ls` — no critical peer errors
- [ ] `npx prisma --version` succeeds
- [ ] `npx shadcn --version` succeeds

---

### Task 0.3 — Directory Structure & Config Files

**Files Created**:

`src/config/domains.ts`:
```typescript
export const ALLOWED_DOMAINS = ['iitpkd.ac.in', 'smail.iitpkd.ac.in'];
export const WHITELISTED_EMAILS: string[] = []; // populate from requirements
export const isAllowedEmail = (email: string) => {
  if (WHITELISTED_EMAILS.includes(email)) return { allowed: true, role: 'OFFICIAL' };
  const domain = email.split('@')[1];
  if (domain === 'iitpkd.ac.in') return { allowed: true, role: 'EMPLOYEE' };
  if (domain === 'smail.iitpkd.ac.in') return { allowed: true, role: 'STUDENT' };
  return { allowed: false, role: null };
};
```

`src/config/feature-flags.ts`:
```typescript
export const FeatureFlags = {
  approvalRequiredStudentGuest: process.env.APPROVAL_REQUIRED_STUDENT_GUEST === 'true',
  approvalRequiredEmployeeGuest: process.env.APPROVAL_REQUIRED_EMPLOYEE_GUEST === 'true',
  approvalRequiredOfficial: process.env.APPROVAL_REQUIRED_OFFICIAL === 'true',
};
```

`src/lib/prisma.ts` — PrismaClient singleton (uses `globalThis` for dev hot-reload):
```typescript
import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

`src/types/api.types.ts` — `ApiResponse<T>`, `PaginatedResult<T>`, `ApiError`

`src/types/pass.types.ts` — `CreatePassInput`, `PassFilters`, `UpdatePassInput`

`src/types/user.types.ts` — `UserProfile`, `SessionUser`

`.env.example` — all env keys with comments (see Environment Variables section above)

Also create `.gitkeep` in: `src/components/{ui,forms,passes,scanner,dashboard,layout}/`, `src/services/`, `src/schemas/`, `src/hooks/`, `src/stores/`, `tests/{unit,integration}/`, `public/uploads/`

**Acceptance Criteria**:
- [ ] `npx tsc --noEmit` passes
- [ ] `domains.ts` exports `isAllowedEmail` function correctly
- [ ] `prisma.ts` singleton pattern in place
- [ ] `.env.example` has all keys

Git commit: `"Created directory structure and config files"`.

---

### Task 0.4 — Prisma Schema, Migration & Seed

**File `prisma/schema.prisma`** — implement all models and enums from the Database Schema section above. Key points:
- All table names use `@@map("snake_case")`.
- `visitorPhotoUrl`, `visitorMobile`, etc. are nullable (`String?`).
- `ccEmails`, `emailSentTo` are `Json? @default("[]")`.
- `approvalRequired Boolean @default(false)` on VisitorPass.
- Indexes: `@@index([passType])`, `@@index([status])`, `@@index([createdById])`, on ScanLog: `@@index([passId])`, `@@index([scannedAt])`.

**`prisma/seed.ts`**:
- 5 users: one per role. Security user: `bcrypt.hashSync('security123', 10)` for password.
- 2 FeatureFlags: `approval_required_student_guest` (enabled: true), `approval_required_employee_guest` (enabled: false).
- 3 VisitorPasses: 1 EMPLOYEE_GUEST (ACTIVE), 1 STUDENT_GUEST (PENDING_APPROVAL with ApprovalRequest), 1 WALKIN (ACTIVE).

**Steps**:
1. `npx prisma migrate dev --name init`
2. Add to `package.json`: `"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }`
3. `npx prisma db seed`
4. Git commit: `"Defined Prisma schema, ran migration, seeded data"`.

**Acceptance Criteria**:
- [ ] `npx prisma validate` passes
- [ ] Migration applies cleanly to fresh DB
- [ ] Seed completes — 5 users, 2 flags, 3 passes in DB
- [ ] Security user password is bcrypt-hashed

---

### Task 0.5 — Shared Utilities: QR, ID Generator, Zod Schemas

**`src/lib/qr.ts`**:
```typescript
import crypto from 'crypto';
import QRCode from 'qrcode';

const SECRET = process.env.QR_HMAC_SECRET!;

export function generateQRPayload(passId: string): string {
  const checksum = crypto.createHmac('sha256', SECRET).update(passId).digest('hex').slice(0, 8);
  return `VMS:${passId}:${checksum}`;
}

export function verifyQRPayload(payload: string): { valid: boolean; passId: string | null } {
  const parts = payload.split(':');
  if (parts.length !== 3 || parts[0] !== 'VMS') return { valid: false, passId: null };
  const [, passId, checksum] = parts;
  const expected = crypto.createHmac('sha256', SECRET).update(passId).digest('hex').slice(0, 8);
  return { valid: checksum === expected, passId: checksum === expected ? passId : null };
}

export async function generateQRCodeDataURL(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { width: 256, margin: 2 });
}
```

**`src/lib/id-generator.ts`**:
```typescript
export function generateUniqueId(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export function generatePassNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `VMS-${date}-${suffix}`;
}
```

**`src/schemas/pass.schema.ts`**:
- `basePassSchema`: `visitorName` (string, min 2), `visitorSex` (enum), `purpose` (string), `visitFrom` (datetime), `visitTo` (datetime). Refinement: `visitTo > visitFrom`.
- `employeeGuestSchema`: `z.object({ passType: z.literal('EMPLOYEE_GUEST') }).merge(basePassSchema)`
- `officialPassSchema`: same with `z.literal('OFFICIAL')`
- `studentGuestSchema`: extends base + `visitorRelation` (string), `visitorAge` (positive int), `approverId` (UUID string)
- `walkinPassSchema`: extends base + `visitorMobile` (10-digit), `visitorAge`, `visitorIdType`, `visitorIdNumber`, `visitorPhotoUrl?`, `pointOfContact`, `phoneConfirmedBy`
- `studentExitSchema`: extends base + `hostelName` (string). Student name comes from session, not form.
- `createPassSchema`: `z.discriminatedUnion('passType', [employeeGuestSchema, officialPassSchema, studentGuestSchema, walkinPassSchema, studentExitSchema])`
- `passFiltersSchema`: query params — `passType?`, `status?`, `search?`, `page?` (default 1), `limit?` (default 20)

**`src/schemas/scan.schema.ts`**: `{ scanType: z.enum(['ENTRY', 'EXIT']), gateLocation: z.string().optional(), notes: z.string().optional() }`

**`src/schemas/user.schema.ts`**: `{ email: z.string().email(), password: z.string().min(6) }`

Git commit: `"Added QR utilities, ID generator, and Zod validation schemas"`.

**Acceptance Criteria**:
- [ ] `generateQRPayload('test-id')` → matches `VMS:test-id:<8-char-hex>`
- [ ] `verifyQRPayload` → `{ valid: true }` for untampered, `{ valid: false }` for tampered
- [ ] `generateQRCodeDataURL` → starts with `data:image/png;base64,`
- [ ] `createPassSchema.parse({passType:'STUDENT_GUEST',...})` → requires `approverId`, `visitorRelation`, `visitorAge`
- [ ] `visitTo` before `visitFrom` throws Zod error

---

### Task 0.6 — NextAuth & RBAC Middleware

**`src/lib/auth.ts`**:
```typescript
// NextAuth v5 config
// Providers: Google, Credentials
// signIn callback:
//   - Google: call isAllowedEmail(email). If not allowed, return false.
//   - Assign role from isAllowedEmail result.
//   - Credentials: find user by email, bcrypt.compare password.
// jwt callback: add id, role, uniqueId, rollNumber to token
// session callback: expose id, role, uniqueId, rollNumber on session.user
// adapter: PrismaAdapter(prisma)
```

**`src/app/api/auth/[...nextauth]/route.ts`**: standard NextAuth v5 route export.

**`src/middleware.ts`**:
```typescript
// matcher: '/(dashboard)/:path*'
// if no session → redirect to /login
// route prefix role check:
//   /employee → EMPLOYEE or ADMIN
//   /student  → STUDENT or ADMIN
//   /official → OFFICIAL or ADMIN
//   /security → SECURITY or ADMIN
//   /admin    → ADMIN
// Wrong role → redirect to /login with error param
```

**`src/lib/api-middleware.ts`**:
```typescript
// withAuth(handler): wraps handler, returns 401 if no session
// withRole(roles[], handler): returns 403 if session.user.role not in roles
// withValidation(schema, handler): parse req body against schema, return 400 with { errors } if fails
```

**`src/lib/auth-utils.ts`**:
```typescript
// getCurrentUser(): returns session user or null (server-side)
// requireAuth(): throws 401 if no session
// requireRole(roles): throws 403 if wrong role
```

Git commit: `"Configured NextAuth with Google OAuth, credentials, and RBAC middleware"`.

**Acceptance Criteria**:
- [ ] `/api/auth/providers` returns `google` and `credentials`
- [ ] `@iitpkd.ac.in` → EMPLOYEE, `@smail.iitpkd.ac.in` → STUDENT
- [ ] Non-allowed domains rejected
- [ ] Credentials login with seeded security user works
- [ ] `/employee` without session → redirect to `/login`
- [ ] `withRole(['SECURITY'])` → 403 for EMPLOYEE user

---

## Phase 1 — Backend (Agent 2)

> **Deliverable**: All services and API routes functional. Every endpoint testable via curl/Postman.  
> **Prerequisite**: Phase 0 complete (schema migrated, seed done, auth configured).

### Task 1.1 — Audit Service & Email Service

**`src/services/audit.service.ts`**:
```typescript
// AuditService.log({ userId?, action, entityType, entityId, changes?, ipAddress? })
// Creates AuditLog record. Non-blocking — wrapped in try/catch, never throws.
// Actions: PASS_CREATED, PASS_UPDATED, PASS_CANCELLED, PASS_APPROVED,
//          PASS_REJECTED, SCAN_ENTRY, SCAN_EXIT, USER_LOGIN
```

**`src/lib/email.ts`**: configure Resend client from `process.env.RESEND_API_KEY`.

**`src/lib/email-templates/`** — create one HTML/React Email template per pass type:
- `employee-guest.tsx` — pass details + QR image embedded
- `official-pass.tsx` — same + dept head CC note
- `student-guest.tsx` — pass details + "pending/approved" status + QR
- `walkin-pass.tsx` — detailed pass + note about physical signature
- `student-exit.tsx` — exit details + return date + QR + forward section
- `approval-request.tsx` — request summary + approve/reject links (deeplinks to admin panel)

**`src/services/email.service.ts`**:
```typescript
// sendPassEmail(pass: VisitorPass): determines recipients by passType:
//   EMPLOYEE_GUEST → to: createdBy.email
//   OFFICIAL       → to: createdBy.email, cc: dept heads
//   STUDENT_GUEST  → to: student.email, cc: asst.warden + 2 placeholders
//   WALKIN         → no email
//   STUDENT_EXIT   → to: student.email, cc: asst.warden
// Logs to EmailLog. Non-blocking for failures.
//
// sendApprovalRequestEmail(request: ApprovalRequest)
//   → to: approver.email with approval link
```

Git commit: `"Implemented audit service and email service"`.

**Acceptance Criteria**:
- [ ] `AuditService.log()` creates record in `audit_logs`, never throws
- [ ] Each email template renders valid HTML with mock data
- [ ] EmailService routes to correct recipients per pass type
- [ ] EmailLog record created for each attempt

---

### Task 1.2 — Pass Service

**`src/services/pass.service.ts`**:

```typescript
async createPass(data: CreatePassInput, userId: string): Promise<VisitorPass>
// 1. Parse with createPassSchema
// 2. generatePassNumber()
// 3. generateQRPayload(uuid) → generateQRCodeDataURL(payload) → qrCodeUrl
// 4. If STUDENT_GUEST:
//      Prisma transaction: create VisitorPass (PENDING_APPROVAL) + create ApprovalRequest
//    Else: create VisitorPass (ACTIVE)
// 5. Non-blocking: EmailService.sendPassEmail(), AuditService.log(PASS_CREATED)
// Return created pass

async getPassById(id: string): Promise<VisitorPass | null>
// include: createdBy, hostProfessor, approvalRequest.{approver,requestedBy}, scanLogs.scannedBy

async listPasses(filters: PassFilters, userId: string, role: Role, page: number, limit: number)
// EMPLOYEE/STUDENT/OFFICIAL: where createdById = userId AND deletedAt = null
// SECURITY: where status = ACTIVE AND deletedAt = null
// ADMIN: all, deletedAt = null
// Apply additional filters: passType, status, search (visitorName), dateFrom/dateTo
// Return { data, total, page, limit }

async updatePass(id: string, data: UpdatePassInput, userId: string)
// Only if status in [DRAFT, ACTIVE] and createdById = userId (or ADMIN)
// AuditService.log(PASS_UPDATED)

async cancelPass(id: string, userId: string)
// Set deletedAt = now(), status = CANCELLED
// AuditService.log(PASS_CANCELLED)
```

Git commit: `"Implemented pass service with all 5 workflow types"`.

**Acceptance Criteria**:
- [ ] EMPLOYEE_GUEST → ACTIVE + QR code in DB
- [ ] STUDENT_GUEST → PENDING_APPROVAL + ApprovalRequest created
- [ ] Pass number: `VMS-YYYYMMDD-XXXX`
- [ ] `listPasses` scoped by role
- [ ] Audit log created on every mutation

---

### Task 1.3 — Approval Service & Scan Service

**`src/services/approval.service.ts`**:
```typescript
async getPendingApprovals(approverId: string): Promise<ApprovalRequest[]>
// where approverId = approverId AND status = PENDING, include pass + requestedBy

async approvePass(requestId: string, approverId: string, remarks?: string)
// Transaction:
//   ApprovalRequest → APPROVED, decidedAt = now(), remarks
//   VisitorPass → ACTIVE
// Non-blocking: EmailService.sendPassEmail(), AuditService.log(PASS_APPROVED)

async rejectPass(requestId: string, approverId: string, remarks: string)
// Transaction:
//   ApprovalRequest → REJECTED, decidedAt = now(), remarks
//   VisitorPass → REJECTED
// Non-blocking: notify student, AuditService.log(PASS_REJECTED)
```

**`src/services/scan.service.ts`**:
```typescript
async verifyAndGetPass(qrPayload: string): Promise<VisitorPass>
// verifyQRPayload(qrPayload) → throws if invalid checksum
// getPassById(passId) → throws if not found
// Check status = ACTIVE
// Check visitFrom <= now() <= visitTo
// Return full pass with all relations

async logScan(passId: string, securityId: string, scanType: ScanType, gateLocation?: string)
// Create ScanLog
// AuditService.log(scanType === 'ENTRY' ? SCAN_ENTRY : SCAN_EXIT)
// Return ScanLog

async getScanHistory(passId: string): Promise<ScanLog[]>
// ordered by scannedAt desc

async getRecentScans(limit = 20): Promise<ScanLog[]>
// all scans, ordered by scannedAt desc, limit N, include pass.visitorName
```

Git commit: `"Implemented approval service and scan service"`.

**Acceptance Criteria**:
- [ ] `getPendingApprovals` returns only PENDING for given approver
- [ ] Approving → pass ACTIVE, `decidedAt` set
- [ ] Rejecting → pass REJECTED, remarks required
- [ ] `verifyAndGetPass` rejects tampered QR
- [ ] `verifyAndGetPass` rejects expired passes (outside visitFrom/visitTo)
- [ ] `logScan` creates ScanLog record
- [ ] All approval mutations transactional

---

### Task 1.4 — All API Route Handlers

Implement every endpoint using `withAuth`, `withRole`, and `withValidation` wrappers. All responses use standard envelope `{ success, data, meta, error }`.

**`src/app/api/passes/route.ts`**:
- `POST` — `withAuth` + `withValidation(createPassSchema)` → `PassService.createPass()` → 201
- `GET` — `withAuth` → parse `passFiltersSchema` from searchParams → `PassService.listPasses()` → 200

**`src/app/api/passes/[id]/route.ts`**:
- `GET` — `withAuth` → `PassService.getPassById()` → check ownership/role → 200 or 404
- `PATCH` — `withAuth` + `withValidation(updatePassSchema)` → `PassService.updatePass()` → 200
- `DELETE` — `withAuth` → `PassService.cancelPass()` → 200

**`src/app/api/passes/[id]/approve/route.ts`**:
- `POST` — `withAuth` + `withRole(['ADMIN'])` + `withValidation({ action, remarks? })` → approve or reject → 200

**`src/app/api/passes/[id]/scan/route.ts`**:
- `POST` — `withAuth` + `withRole(['SECURITY'])` + `withValidation(scanInputSchema)` → `ScanService.logScan()` → 201

**`src/app/api/passes/verify/route.ts`**:
- `GET` — `withAuth` + `withRole(['SECURITY'])` → validate `?code=` param → `ScanService.verifyAndGetPass()` → 200

**`src/app/api/users/route.ts`**:
- `GET` — `withAuth` → filter by `?role=` → return users list (no passwords)

**`src/app/api/users/me/route.ts`**:
- `GET` — `withAuth` → return `getCurrentUser()` profile

**`src/app/api/upload/photo/route.ts`**:
- `POST` — `withAuth` + `withRole(['SECURITY'])` → parse multipart, validate JPEG/PNG + size < 5MB, save to `./public/uploads/<uuid>.<ext>`, return `{ url: '/uploads/<filename>' }` → 201

**`src/app/api/scan-logs/route.ts`**:
- `GET` — `withAuth` + `withRole(['SECURITY', 'ADMIN'])` → paginated, filter by `passId`, `dateFrom`, `dateTo`

Git commit: `"Created all API route handlers"`.

**Acceptance Criteria**:
- [ ] `POST /api/passes` → 201 for valid body
- [ ] `POST /api/passes` → 400 with field errors for invalid body
- [ ] `GET /api/passes` → paginated with `meta`
- [ ] `GET /api/passes/:id` → 404 for non-existent
- [ ] `POST /api/passes/:id/approve` → 403 for non-ADMIN
- [ ] `GET /api/passes/verify?code=VMS:...` → pass details for valid QR
- [ ] All endpoints → 401 for unauthenticated
- [ ] Upload → 413 for files > 5MB

---

## Phase 2 — Frontend (Agent 3)

> **Deliverable**: All UI pages navigable. Users can log in, create passes, view QR, scan, and approve.  
> **Prerequisite**: Phase 0 complete. Can run in parallel with Phase 1 if API is mocked.

### Task 2.1 — Login Page

**Install shadcn components**: `npx shadcn add button input card separator label sonner`

**`src/app/(auth)/layout.tsx`** — centered card layout, no sidebar.

**`src/app/(auth)/login/page.tsx`**:
- Left panel: IIT Palakkad branding, app name "VMS", tagline.
- Right panel:
  - "Sign in with Google" button → `signIn('google')` from `next-auth/react`.
  - Separator "OR".
  - Collapsible "Security Staff Login" form: email + password → `signIn('credentials', { email, password })`.
  - Error display via `sonner` toast.
- Fully responsive (mobile: single column, desktop: two columns).

Git commit: `"Built login page"`.

**Acceptance Criteria**:
- [ ] Renders at `/login`
- [ ] Google button triggers OAuth
- [ ] Credentials form validates empty fields
- [ ] Responsive on mobile/desktop
- [ ] Error toast on failed login

---

### Task 2.2 — Dashboard Layout & Role Dashboards

**Install shadcn**: `npx shadcn add avatar dropdown-menu sheet tooltip badge table tabs`

**`src/stores/ui.store.ts`** — Zustand: `{ sidebarOpen: bool, setSidebarOpen: fn }`

**`src/components/layout/Sidebar.tsx`**:
- Role-aware navigation (links differ per role):
  - EMPLOYEE: Dashboard, My Passes, Create Pass
  - STUDENT: Dashboard, Guest Pass, Exit Pass
  - OFFICIAL: Dashboard, Create Pass, My Passes
  - SECURITY: Dashboard, Scan QR, Walk-in Pass
  - ADMIN: Dashboard, All Passes, Approvals, Scan Logs
- Collapsible on desktop, bottom sheet on mobile.
- Active link highlight, logo at top.

**`src/components/layout/Header.tsx`** — user avatar + name dropdown (logout), breadcrumbs, mobile hamburger.

**`src/app/(dashboard)/layout.tsx`** — compose Sidebar + Header + `<main>`. Server-side session check; redirect if unauthenticated.

**`src/components/dashboard/StatsCards.tsx`** — 4 stat cards (total, active, pending, scans).

**`src/components/dashboard/RecentActivity.tsx`** — last 5 items list.

**Role dashboards** (`page.tsx` for each role):
- **Employee**: stats + recent passes + "Create New Pass" CTA
- **Student**: guest pass + exit pass counts + quick action buttons
- **Official**: office pass stats + create button
- **Security**: today's scan count + big "Scan QR" button + "Walk-in Pass" button
- **Admin**: system-wide stats + pending approvals count + recent activity

All dashboards use TanStack Query to fetch data from the API.

Git commit: `"Built dashboard layout and all role dashboards"`.

**Acceptance Criteria**:
- [ ] Sidebar shows role-appropriate items
- [ ] Header shows user, logout works
- [ ] Responsive (hamburger on mobile)
- [ ] Stats and activity load from API
- [ ] Security dashboard highlights scan + walk-in actions

---

### Task 2.3 — All 5 Pass Creation Forms

**Install shadcn**: `npx shadcn add select textarea dialog popover calendar`

**`src/hooks/usePasses.ts`**:
- `useCreatePass()` — mutation: `POST /api/passes`
- `useMyPasses(filters?)` — query: `GET /api/passes`
- `usePassDetail(id)` — query: `GET /api/passes/:id`

**`src/hooks/useApprovals.ts`**:
- `usePendingApprovals()` — query: `GET /api/passes?status=PENDING_APPROVAL`
- `useApprovePass()` — mutation: `POST /api/passes/:id/approve`

All forms use React Hook Form + Zod resolver. Inline field errors. Submit loading state. Success toast + redirect. Error toast on failure.

**Workflow A — `src/components/forms/EmployeePassForm.tsx`**:
- Fields: Visitor Name, Sex (select), Purpose (textarea), Visit From (datetime), Visit To (datetime)
- Schema: `employeeGuestSchema`

**Workflow B — `src/components/forms/OfficialPassForm.tsx`**:
- Same fields as A, `passType: 'OFFICIAL'`

**Workflow C — `src/components/forms/StudentGuestPassForm.tsx`**:
- Fields: Name, Sex, Relation, Age (number input), Purpose, Visit From/To
- Approver dropdown: searchable, fetches `GET /api/users?role=ADMIN`
- Notice banner: "This pass requires faculty approval before it becomes active."
- On success: toast "Pass submitted for approval", redirect to student dashboard

**Workflow D — `src/components/forms/WalkinPassForm.tsx`**:
- Fields: Name, Sex, Mobile (10-digit), Age, Purpose, Point of Contact, Phone Confirmed By, ID Type (select: Aadhar/Passport/DL), ID Number, Visit From/To
- Webcam section:
  1. "Open Camera" button → `navigator.mediaDevices.getUserMedia({ video: true })`
  2. Live `<video>` preview
  3. "Capture" button → draws to `<canvas>`, `canvas.toBlob()` → `FormData` → `POST /api/upload/photo` → store URL
  4. Preview captured photo with "Retake" option
- On success: navigate to pass detail (for printing)

**Workflow E — `src/components/forms/StudentExitPassForm.tsx`**:
- Student name: auto-filled from session (read-only)
- Fields: Purpose, Hostel Name (select: predefined list), Exit Date/Time (visitFrom), Return Date/Time (visitTo)
- Validation: visitTo must be > visitFrom

Git commit: `"Built all 5 pass creation forms"`.

**Acceptance Criteria**:
- [ ] All 5 forms render, validate correctly
- [ ] Workflow C: approver dropdown loads, "pending" notice visible
- [ ] Workflow D: webcam activates, capture works, photo URL stored
- [ ] Workflow E: student name from session, return > exit enforced
- [ ] All: `visitTo > visitFrom` validated client-side

---

### Task 2.4 — Pass Detail, QR Display & Print Layout

**`src/components/passes/PassQRCode.tsx`** — renders `<img src={qrCodeUrl} />`.

**`src/components/passes/PassCard.tsx`** — compact: visitor name, pass type badge, status badge, date range.

**`src/components/passes/PassDetail.tsx`**:
- Full info card: all captured fields in labeled rows.
- `<PassQRCode />` prominently displayed.
- Status badge: green=ACTIVE, yellow=PENDING_APPROVAL, red=REJECTED, grey=EXPIRED/CANCELLED.
- Action buttons: Print (`window.print()`), Cancel (confirmation dialog → DELETE).
- Workflow E: "Forward" button — opens email dialog to send to additional authorities.
- Scan history timeline at bottom: entry/exit events with timestamps.

**`src/components/passes/PassPrintLayout.tsx`**:
- `@media print` optimized (sidebar/header hidden via CSS).
- IIT Palakkad header: institute name, "VISITOR PASS" title, pass number, date issued.
- Two-column body: visitor details left, QR code right.
- Workflow D additions:
  - Visitor photo (full display).
  - `"Visitor Signature: _________________________"`
  - `"Host Signature & Official Seal: _________________________"`
- Footer: generation timestamp, valid from/to.

Add to `src/app/globals.css`:
```css
@media print {
  nav, header, aside, .no-print { display: none !important; }
  .print-layout { display: block !important; }
}
```

**`src/app/(dashboard)/employee/passes/[id]/page.tsx`** — fetch via `usePassDetail(id)`, render `<PassDetail />`. (Also add equivalent pages for student and security routes.)

Git commit: `"Built pass detail view with QR, print layout, and scan history"`.

**Acceptance Criteria**:
- [ ] Pass detail shows all fields
- [ ] QR renders as image
- [ ] Status badge colors correct
- [ ] Print hides sidebar/header
- [ ] Workflow D print: photo + signature + counter-sign blocks
- [ ] Cancel opens confirmation, soft-deletes on confirm
- [ ] Scan history shows entry/exit events

---

### Task 2.5 — QR Scanner & Approval Queue

**Install**: `npm install html5-qrcode` (already in deps)

**`src/hooks/useScanner.ts`**:
- `useVerifyQR()` — mutation: `GET /api/passes/verify?code=<payload>`
- `useLogScan()` — mutation: `POST /api/passes/:id/scan`

**`src/components/scanner/QRScanner.tsx`**:
- Mount `Html5Qrcode` on component load. Prompt for camera permission.
- Permission denied → show friendly error with instructions.
- Scanning overlay: border guide box centered on camera feed.
- On decode → call `verifyQR(payload)`. Success → open `ScanResultModal`. Failure → inline error, auto-retry.

**`src/components/scanner/ScanResultModal.tsx`**:
- Dialog/modal over camera view.
- Shows: visitor name, pass type, purpose, visit window, status badge.
- If WALKIN: shows visitor photo.
- ENTRY / EXIT radio toggle.
- Gate location text input (optional).
- "Confirm Scan" button → `logScan({ scanType, gateLocation })` → success toast → close modal → camera resumes.
- "Cancel" → close modal, camera resumes.

**`src/app/(dashboard)/security/scan/page.tsx`** — full-screen scanner page with `<QRScanner />`.

**`src/components/passes/ApprovalCard.tsx`**:
- Pass summary: student name, visitor name, relation, age, purpose, visit dates.
- Expandable: full details.
- Approve button (green) + optional remarks.
- Reject button (red) + required remarks textarea.
- Loading states on both actions.

**`src/app/(dashboard)/admin/approvals/page.tsx`**:
- Fetches pending approvals via `usePendingApprovals()`.
- Filter: date range picker.
- Sort: newest first.
- Renders `<ApprovalCard />` for each item.
- Empty state: "No pending approvals" illustration.

Git commit: `"Built QR scanner with result modal and admin approval queue"`.

**Acceptance Criteria**:
- [ ] Camera activates, shows live preview
- [ ] Permission denied shows helpful error
- [ ] Valid QR → modal with correct details
- [ ] Invalid QR → error message, scan continues
- [ ] ENTRY/EXIT toggle works, confirm logs scan
- [ ] Approval queue lists pending items
- [ ] Approve → pass ACTIVE, disappears from list
- [ ] Reject → requires remarks, pass REJECTED

---

## Phase 3 — Integration (Agent 4)

> **Deliverable**: All components wired together. End-to-end flows verified. Tests written and passing.  
> **Prerequisite**: Phases 1 and 2 complete.

### Task 3.1 — End-to-End Wiring & Bug Fixes

**Steps**:
1. Test each workflow end-to-end manually:
   - **Workflow A**: Login Employee → Create guest pass → View detail → Verify QR image shows → Print.
   - **Workflow B**: Login Official → Create pass → Check EmailLog record created.
   - **Workflow C**: Login Student → Create guest pass → Verify `PENDING_APPROVAL` status → Login Admin → Approve → Verify pass is `ACTIVE` + EmailLog created.
   - **Workflow D**: Login Security → Create walk-in pass with webcam photo → View detail → Print (verify photo + signature blocks) → Scan QR → Log entry.
   - **Workflow E**: Login Student → Create exit pass → Verify email sent → Forward button works.
2. Fix any routing gaps, missing data-fetching, middleware bugs, form submission errors found.
3. Verify audit logs exist for: every pass creation, approval, rejection, scan.
4. Verify role-scoped data: Employee A cannot see Employee B's passes.
5. Verify QR scan flow: Security scans valid QR → modal shows → confirm entry → ScanLog created.
6. Git commit: `"Fixed integration issues across all workflows"`.

**Acceptance Criteria**:
- [ ] All 5 pass workflows work end-to-end
- [ ] Approval workflow: pending → approved → active
- [ ] QR scan: scan → modal → confirm → ScanLog created
- [ ] Role scoping enforced (API + UI)
- [ ] AuditLog entries exist for every mutation
- [ ] EmailLog entries exist for every email-triggering event

---

### Task 3.2 — Unit Tests

**Setup**: Add Vitest (or Jest) with TypeScript.
```
npm install -D vitest @vitejs/plugin-react
```
Add to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`

**Test files**:

`tests/unit/lib/qr.test.ts`:
- Valid payload generation and verification
- Tampered payload rejected
- Wrong secret rejected

`tests/unit/lib/id-generator.test.ts`:
- `generateUniqueId()` returns exactly 10 digits
- `generatePassNumber()` matches `VMS-YYYYMMDD-XXXX` format

`tests/unit/schemas/pass.schema.test.ts`:
- Each schema: valid data passes, missing required fields fail
- `visitTo` before `visitFrom` fails
- `walkinPassSchema` rejects non-10-digit mobile
- `studentGuestSchema` requires `approverId`, `visitorRelation`, `visitorAge`

`tests/unit/services/pass.service.test.ts` (mock Prisma + utilities):
- EMPLOYEE_GUEST → status ACTIVE, QR generated
- STUDENT_GUEST → status PENDING_APPROVAL, ApprovalRequest created
- `listPasses` returns role-scoped results
- `cancelPass` sets `deletedAt`

`tests/unit/services/approval.service.test.ts`:
- Approve → APPROVED, decidedAt set, pass → ACTIVE
- Reject → REJECTED, remarks required

`tests/unit/services/scan.service.test.ts`:
- Valid QR + active pass → returns pass details
- Tampered QR → throws error
- Expired pass → throws error

Git commit: `"Added unit tests for utilities, schemas, and services"`.

**Acceptance Criteria**:
- [ ] `npm run test` — all tests pass
- [ ] > 80% coverage on `services/` and `schemas/`
- [ ] Prisma mocked — no real DB calls
- [ ] Covers happy paths, edge cases, error cases

---

### Task 3.3 — Integration Tests (API Layer)

**Setup**: Use a separate test database `.env.test` with `DATABASE_URL` pointing to `vms_test_db`.

`tests/integration/setup.ts`:
- Before all: `prisma.$executeRaw` to reset tables (or use `prisma migrate reset --force`), then run seed.
- After all: clean up.

`tests/integration/api/passes.test.ts`:
- Create each of 5 pass types → verify response shape + DB record.
- List passes → verify role scoping.
- Get pass by ID → 200 for owner, 404 for wrong ID.
- Cancel pass → verify CANCELLED status.

`tests/integration/api/auth.test.ts`:
- Credentials login with seeded security user → session returned.
- Wrong password → 401.

`tests/integration/api/approvals.test.ts`:
- Create STUDENT_GUEST → PENDING_APPROVAL.
- Approve → ACTIVE.
- Reject → REJECTED.

`tests/integration/api/scan.test.ts`:
- Verify valid QR → 200 with pass details.
- Verify tampered QR → 400 error.
- Log scan → ScanLog created.
- Log exit scan → ScanLog with ENTRY then EXIT entries.

Git commit: `"Added API integration tests"`.

**Acceptance Criteria**:
- [ ] All tests pass against test DB
- [ ] All 5 pass creation workflows tested
- [ ] RBAC verified (401/403 for wrong roles)
- [ ] Approval state transitions verified
- [ ] DB cleaned between test suites

---

## Phase 4 — Local Run (Agent 5)

> **Deliverable**: Any developer can clone, follow the README, and be up and running in under 10 minutes.  
> **Prerequisite**: All previous phases complete.

### Task 4.1 — Scripts, README & Env Documentation

**Add to `package.json` scripts**:
```json
{
  "db:migrate": "npx prisma migrate dev",
  "db:seed": "npx prisma db seed",
  "db:reset": "npx prisma migrate reset",
  "db:studio": "npx prisma studio",
  "type-check": "tsc --noEmit"
}
```

**Write `README.md`** (replace existing):

```markdown
# IIT Palakkad — Gate Security & Visitor Management System

## What This Is
Full-stack web app for campus gate security management: visitor passes, QR scanning, approval workflows, and audit trails.

## Prerequisites
- Node.js 18+
- PostgreSQL 15+ (running locally)
- Google Cloud project with OAuth 2.0 credentials (add `http://localhost:3000/api/auth/callback/google` as redirect URI)

## Quick Start
1. clone this repo
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in all values
4. `npm run db:migrate`
5. `npm run db:seed`
6. `npm run dev`
7. Open http://localhost:3000

## Seeded Test Accounts
| Role | Email | Password |
|------|-------|----------|
| EMPLOYEE | employee@iitpkd.ac.in | (Google OAuth) |
| STUDENT | student@smail.iitpkd.ac.in | (Google OAuth) |
| OFFICIAL | official@iitpkd.ac.in | (Google OAuth) |
| SECURITY | security@vms.local | security123 |
| ADMIN | admin@iitpkd.ac.in | (Google OAuth) |

## Available Scripts
| Script | What it does |
|--------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check |
| `npm run test` | Run all tests |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Seed test data |
| `npm run db:reset` | Reset DB and re-migrate |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

## Environment Variables
See `.env.example` for all variables with descriptions.

## Project Structure
See implementation_plan.md → Directory Structure section.
```

Git commit: `"Added README and developer convenience scripts"`.

**Acceptance Criteria**:
- [ ] All scripts work: `dev`, `build`, `db:migrate`, `db:seed`, `db:reset`, `db:studio`, `test`
- [ ] README is complete and accurate
- [ ] `.env.example` has every key with comments
- [ ] Seeded accounts documented

---

### Task 4.2 — Final Verification & Cleanup

**Steps**:
1. **Fresh install test**: delete `node_modules`, `.next`, re-run full setup from README. Confirm it works.
2. **Type check**: `npm run type-check` → zero errors.
3. **Lint**: `npm run lint` → zero errors.
4. **Tests**: `npm run test` → all pass.
5. **Build**: `npm run build` → succeeds.
6. **Manual smoke test** — login each role, exercise each workflow:
   - Employee: create pass A → view → print → cancel.
   - Official: create pass B.
   - Student: create pass C (guest) → admin approves → verify email log. Create pass E (exit).
   - Security: create pass D with photo → print (verify signature blocks). Scan QR of any pass → entry → exit.
   - Admin: view approval queue → approve/reject.
7. Remove: `console.log` debug statements, unused imports, placeholder TODOs.
8. Git commit: `"Final cleanup — all systems verified locally"`.

**Acceptance Criteria**:
- [ ] Fresh install works from scratch, no undocumented steps
- [ ] Zero TypeScript errors
- [ ] Zero lint errors  
- [ ] All tests pass
- [ ] Production build succeeds
- [ ] All 5 workflows manually verified

---

## Dependency Graph

```mermaid
graph TD
    P0["Phase 0: Scaffold<br/>(Agent 1)"] --> P1["Phase 1: Backend<br/>(Agent 2)"]
    P0 --> P2["Phase 2: Frontend<br/>(Agent 3)"]
    P1 --> P3["Phase 3: Integration<br/>(Agent 4)"]
    P2 --> P3
    P3 --> P4["Phase 4: Local Run<br/>(Agent 5)"]
```

> Phases 1 and 2 can execute **in parallel** once Phase 0 is done.

## Summary

| Phase | Agent | Key Output |
|-------|-------|-----------|
| 0 — Scaffold | 1 | Next.js + deps + Prisma + auth + utilities |
| 1 — Backend | 2 | All services + API routes |
| 2 — Frontend | 3 | All pages, forms, scanner, approval UI |
| 3 — Integration | 4 | E2E verified + unit + integration tests |
| 4 — Local Run | 5 | README + scripts + final verification |
