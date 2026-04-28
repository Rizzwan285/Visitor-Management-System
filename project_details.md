# Visitor Management System — Complete Developer Context & Architecture Dump

> **For any AI reading this:** Treat this document as the authoritative source of truth for the project's current state. Read this before exploring the codebase. All schemas, routes, and business rules here reflect the actual code as of April 2026.

---

## 1. Project Overview

**Name:** IIT Palakkad Visitor Management System  
**Goal:** Digitize the lifecycle of visitor passes — drafting → multi-level approval → QR generation → security scanning — and track inter-campus student movement.  
**Hosting:** Deployed on **Render** (backend) with **Supabase PostgreSQL** as the database and **Supabase Object Storage** for photos/signatures.  
**Auth Providers:** Google OAuth (primary) + Credentials (Security staff only).  
**Mail Provider:** Resend SDK (`resend`).

---

## 2. Technology Stack

| Layer | Tech |
|---|---|
| Framework | Next.js App Router (v15.x), React 19 |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI, `clsx`, `tailwind-merge`, `class-variance-authority` |
| Icons | `lucide-react` |
| Client State | Zustand |
| Server State | `@tanstack/react-query` |
| Auth | NextAuth v5 (`next-auth@5.0.0-beta.30`) + `@auth/prisma-adapter` |
| Database | PostgreSQL via Prisma ORM (`@prisma/client`) |
| File Storage | Supabase Object Storage (proxied via `/api/secure-image`) |
| Email | Resend SDK |
| QR Codes | `qrcode` (generation) + `html5-qrcode` (camera scanning) |
| Forms | `react-hook-form` + `zod` + `@hookform/resolvers` |
| PDF | `@react-pdf/renderer` |
| Signatures | `react-signature-canvas` |
| Date | `date-fns`, `react-day-picker` |
| Toasts | `sonner` |
| Unique IDs | `uuid` |
| Theming | `next-themes` |

**npm Scripts:**
```
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run db:migrate   # npx prisma migrate dev
npm run db:seed      # npx prisma db seed
npm run db:reset     # npx prisma migrate reset
npm run db:studio    # npx prisma studio
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
```

---

## 3. Complete Directory & File Structure

```
Visitor-Management-System/
├── .env                          # Secrets (see §7)
├── .gitignore
├── .prettierrc
├── components.json               # shadcn/ui config
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── prisma/
│   └── schema.prisma             # Canonical DB schema (see §5)
├── public/                       # Static assets
├── reskin.js                     # Styling utility
├── scripts/                      # Utility scripts
├── set-admin-pwd.ts              # One-time admin password setup
├── tsconfig.json
├── update-pwd.ts                 # Password update utility
└── src/
    ├── app/
    │   ├── layout.tsx            # Root layout (providers, theme)
    │   ├── page.tsx              # Root → redirects to role dashboard
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   └── login/page.tsx    # Google OAuth + credentials login
    │   ├── (dashboard)/
    │   │   ├── layout.tsx        # Protected layout (session gate)
    │   │   ├── admin/
    │   │   │   ├── page.tsx              # Admin dashboard (stats, actions)
    │   │   │   ├── approvals/page.tsx    # Manage all approval requests
    │   │   │   ├── logs/page.tsx         # Audit log viewer
    │   │   │   ├── passes/
    │   │   │   │   ├── page.tsx          # All passes list
    │   │   │   │   └── [id]/page.tsx     # Pass detail / management
    │   │   │   └── reports/
    │   │   │       ├── page.tsx          # Report generation UI
    │   │   │       └── ReportPDF.tsx     # PDF layout for reports
    │   │   ├── employee/
    │   │   │   ├── page.tsx
    │   │   │   └── passes/
    │   │   │       ├── page.tsx
    │   │   │       ├── new/page.tsx      # Create employee guest pass
    │   │   │       └── [id]/page.tsx
    │   │   ├── official/
    │   │   │   ├── page.tsx
    │   │   │   └── passes/
    │   │   │       ├── page.tsx
    │   │   │       ├── new/page.tsx      # Create official pass
    │   │   │       └── [id]/page.tsx
    │   │   ├── oic/
    │   │   │   └── page.tsx             # OIC inbox — approve/reject student passes
    │   │   ├── security/
    │   │   │   ├── page.tsx             # Security dashboard (scan stats, overstaying)
    │   │   │   ├── scan/page.tsx        # QR scanner interface
    │   │   │   ├── walkin/page.tsx      # Manual walk-in pass creation
    │   │   │   └── passes/
    │   │   │       ├── page.tsx         # "My Passes" — passes created by this security guard
    │   │   │       └── [id]/page.tsx    # Pass detail view
    │   │   ├── student/
    │   │   │   ├── page.tsx
    │   │   │   └── passes/
    │   │   │       ├── guest/page.tsx   # Create student guest pass
    │   │   │       ├── exit/page.tsx    # Create student exit pass
    │   │   │       └── [id]/page.tsx
    │   │   └── (roles)/
    │   │       └── warden/
    │   │           ├── page.tsx                    # Warden dashboard
    │   │           └── passes/[id]/page.tsx        # Approve/reject from warden view
    │   └── api/
    │       ├── auth/[...nextauth]/route.ts          # NextAuth handler
    │       ├── dashboard/route.ts                   # GET stats for dashboard
    │       ├── passes/
    │       │   ├── route.ts                         # POST (create), GET (list — role-scoped)
    │       │   ├── verify/route.ts                  # POST — verify QR payload hash
    │       │   └── [id]/
    │       │       ├── route.ts                     # GET (single), PATCH (update), DELETE
    │       │       ├── approve/route.ts             # POST — approve or reject pass
    │       │       ├── forward/route.ts             # POST — forward pass to another approver
    │       │       ├── photo/route.ts               # POST — attach photo to pass
    │       │       ├── qr/route.ts                  # GET — retrieve/regenerate QR code
    │       │       └── scan/route.ts                # POST — log a gate scan
    │       ├── reports/route.ts                     # GET — CSV report generation
    │       ├── scan-logs/route.ts                   # GET — scan history
    │       ├── secure-image/[filename]/route.ts     # GET — serve Supabase images via session-gated proxy
    │       ├── security/
    │       │   └── overstaying/route.ts             # GET — visitors who exceeded visit window
    │       ├── upload/
    │       │   └── photo/route.ts                   # POST — upload photo to Supabase storage
    │       ├── users/
    │       │   ├── route.ts                         # GET — list users (admin)
    │       │   └── me/route.ts                      # GET — current user profile
    │       └── warden/
    │           └── passes/route.ts                  # GET — passes pending warden approval
    ├── components/
    │   ├── providers.tsx                            # QueryClient + ThemeProvider wrapper
    │   ├── theme-toggle.tsx                         # Light/dark switcher
    │   ├── dashboard/
    │   │   ├── StatsCards.tsx
    │   │   ├── RecentActivity.tsx
    │   │   └── OverstayingAlerts.tsx
    │   ├── forms/
    │   │   ├── EmployeePassForm.tsx
    │   │   ├── OfficialPassForm.tsx
    │   │   ├── StudentGuestPassForm.tsx
    │   │   ├── StudentExitPassForm.tsx
    │   │   └── WalkinPassForm.tsx                   # Photo + 3-signature + ID capture
    │   ├── layout/
    │   │   └── Sidebar.tsx                          # Role-aware navigation sidebar
    │   ├── passes/
    │   │   └── PassList.tsx                         # Reusable pass listing component
    │   ├── scanner/
    │   │   └── ScanResultModal.tsx                  # Result overlay after QR scan
    │   └── ui/                                      # shadcn/ui primitives (Button, Card, etc.)
    ├── config/
    │   ├── domains.ts            # Email domain → role mapping + whitelist logic
    │   ├── email-config.ts       # Email sender addresses + subjects
    │   └── feature-flags.ts     # Approval-required flags per pass type
    ├── hooks/
    │   ├── usePasses.ts          # Pass CRUD + list queries
    │   ├── useDashboard.ts       # Dashboard stats
    │   ├── useApprovals.ts       # Approval request operations
    │   ├── useScanner.ts         # QR scanner state and submit
    │   └── useUsers.ts           # User list / profile
    ├── lib/
    │   ├── auth.ts               # NextAuth full config (Google + Credentials providers)
    │   ├── auth.config.ts        # Edge-safe auth config (used in middleware)
    │   ├── auth-utils.ts         # Session helpers (getServerSession wrappers)
    │   ├── api-middleware.ts     # withAuth / withRole / withValidation chain
    │   ├── prisma.ts             # Prisma client singleton
    │   ├── email.ts              # Resend client instance
    │   ├── qr.ts                 # QR image generation
    │   ├── qr-and-id.ts          # HMAC-encrypted QR payload + pass number generation
    │   ├── supabase.ts           # Supabase JS client (for object storage)
    │   ├── utils.ts              # General utilities (cn, formatters)
    │   └── email-templates/      # HTML email template files per pass type
    ├── schemas/
    │   ├── pass.schema.ts        # Zod schemas for pass creation (discriminated union per type)
    │   ├── scan.schema.ts        # Zod schema for scan log submission
    │   └── user.schema.ts        # Zod schema for user operations
    ├── services/
    │   ├── pass.service.ts       # Core: create, list, update, approve passes
    │   ├── approval.service.ts   # Approval request creation and resolution
    │   ├── email.service.ts      # Email dispatch with templates
    │   ├── scan.service.ts       # Gate scan state-machine + overstaying calculation
    │   ├── audit.service.ts      # Audit log writes
    │   └── api.ts                # Client-side fetch wrapper (used by hooks)
    ├── stores/
    │   └── ui.store.ts           # Zustand: sidebar open/close
    ├── types/
    │   ├── api.types.ts          # API response shapes + pagination types
    │   ├── pass.types.ts         # Pass-related TypeScript types
    │   └── user.types.ts         # User types
    └── proxy.ts                  # Email image proxy utility
```

---

## 4. Authentication & Route Protection

### Auth Providers (`src/lib/auth.ts`)
1. **Google OAuth** — primary login for all roles except Security.  
   - `@iitpkd.ac.in` → `EMPLOYEE`  
   - `@smail.iitpkd.ac.in` → `STUDENT`  
   - Specific whitelisted emails (e.g. `office_cs@iitpkd.ac.in`) are matched against `WhitelistedEmail` table and assigned a custom role.
2. **Credentials Provider** — Security staff log in with email + bcrypt password. Role is hard-coded to `SECURITY` from DB.

### JWT Session Shape
```typescript
// Fields added to token in jwt() callback:
{
  id: string;
  role: Role;
  rollNumber: string | null;
  uniqueId: string | null;
}
```

### Route Guard Middleware (`src/middleware.ts`)
```typescript
const ROUTE_ROLE_MAP: Record<string, string[]> = {
  '/employee': ['EMPLOYEE', 'ADMIN'],
  '/student':  ['STUDENT', 'ADMIN'],
  '/official': ['OFFICIAL', 'ADMIN'],
  '/security': ['SECURITY', 'ADMIN'],
  '/admin':    ['ADMIN'],
  '/oic':      ['OIC_STUDENT_SECTION', 'ADMIN'],
  '/warden':   ['ASSISTANT_WARDEN', 'ADMIN'],
};
```
Unauthorized access → `307` redirect to `/login?error=AccessDenied`.

### API Middleware Chain (`src/lib/api-middleware.ts`)
All API routes are wrapped in composable middleware:
- `withAuth(handler)` — enforces active NextAuth session
- `withRole(roles, handler)` — restricts to specific roles
- `withValidation(schema, handler)` — validates body against Zod schema  
Typical pattern: `withAuth(withRole(['SECURITY'], withValidation(scanSchema, handler)))`

---

## 5. Complete Database Schema

The canonical schema is at `prisma/schema.prisma`. Copy it exactly when writing Prisma queries.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  EMPLOYEE
  STUDENT
  OFFICIAL
  SECURITY
  ADMIN
  OIC_STUDENT_SECTION
  ASSISTANT_WARDEN
}

enum PassType {
  EMPLOYEE_GUEST
  OFFICIAL
  STUDENT_GUEST
  WALKIN
  STUDENT_EXIT
}

enum PassStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  ACTIVE
  EXPIRED
  CANCELLED
}

enum ApprovalStatus {
  PENDING
  APPROVED
  REJECTED
}

enum ScanType {
  ENTRY
  INTERMEDIATE_EXIT
  INTERMEDIATE_ENTRY   // visitor briefly exits and re-enters
  FINAL_EXIT
  STUDENT_EXIT_OUT
  STUDENT_EXIT_RETURN
}

enum Sex {
  MALE
  FEMALE
  OTHER
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String?
  role         Role
  rollNumber   String?   @map("roll_number")
  uniqueId     String?   @map("unique_id")
  department   String?
  passwordHash String?   @map("password_hash")
  avatarUrl    String?   @map("avatar_url")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  createdPasses    VisitorPass[]     @relation("CreatedPasses")
  hostedPasses     VisitorPass[]     @relation("HostedPasses")
  approvalRequests ApprovalRequest[] @relation("RequestedApprovals")
  approvedRequests ApprovalRequest[] @relation("ApprovedRequests")
  scanLogs         ScanLog[]
  auditLogs        AuditLog[]

  @@map("users")
}

model VisitorPass {
  id               String     @id @default(uuid())
  passNumber       String     @unique @map("pass_number")
  passType         PassType   @map("pass_type")
  status           PassStatus @default(DRAFT)
  createdById      String     @map("created_by_id")
  visitorName      String     @map("visitor_name")
  visitorSex       Sex        @map("visitor_sex")
  purpose          String
  visitFrom        DateTime   @map("visit_from")
  visitTo          DateTime   @map("visit_to")
  visitorRelation  String?    @map("visitor_relation")
  visitorAge       Int?       @map("visitor_age")
  visitorMobile    String?    @map("visitor_mobile")
  visitorIdType    String?    @map("visitor_id_type")
  visitorIdNumber  String?    @map("visitor_id_number")
  visitorPhotoUrl  String?    @map("visitor_photo_url")   // Supabase storage key
  phoneConfirmedBy String?    @map("phone_confirmed_by")
  pointOfContact   String?    @map("point_of_contact")
  pocMobile        String?    @map("poc_mobile")
  hostelName       String?    @map("hostel_name")
  qrCodeData       String     @map("qr_code_data")        // HMAC-encrypted payload
  qrCodeUrl        String?    @map("qr_code_url")
  approvalRequired Boolean    @default(false) @map("approval_required")
  hostProfessorId  String?    @map("host_professor_id")
  ccEmails         Json?      @default("[]") @map("cc_emails")
  emailSentTo      Json?      @default("[]") @map("email_sent_to")
  emailSent        Boolean    @default(false) @map("email_sent")

  // Signatures (stored as Supabase storage keys)
  visitorSignatureUrl  String? @map("visitor_signature_url")
  securitySignatureUrl String? @map("security_signature_url")
  hostSignatureUrl     String? @map("host_signature_url")
  countersignUrl       String? @map("countersign_url")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  createdBy       User             @relation("CreatedPasses", fields: [createdById], references: [id])
  hostProfessor   User?            @relation("HostedPasses", fields: [hostProfessorId], references: [id])
  approvalRequest ApprovalRequest?
  scanLogs        ScanLog[]
  emailLogs       EmailLog[]

  @@index([passType])
  @@index([status])
  @@index([createdById])
  @@index([hostProfessorId])
  @@index([createdAt])
  @@map("visitor_passes")
}

model ApprovalRequest {
  id            String         @id @default(uuid())
  passId        String         @unique @map("pass_id")
  requestedById String         @map("requested_by_id")
  approverId    String?        @map("approver_id")
  status        ApprovalStatus @default(PENDING)
  remarks       String?
  decidedAt     DateTime?      @map("decided_at")
  createdAt     DateTime       @default(now()) @map("created_at")
  updatedAt     DateTime       @updatedAt @map("updated_at")

  pass        VisitorPass @relation(fields: [passId], references: [id])
  requestedBy User        @relation("RequestedApprovals", fields: [requestedById], references: [id])
  approver    User?       @relation("ApprovedRequests", fields: [approverId], references: [id])

  @@map("approval_requests")
}

model ScanLog {
  id                String   @id @default(uuid())
  passId            String   @map("pass_id")
  scannedById       String   @map("scanned_by_id")
  scanType          ScanType @map("scan_type")
  scannedAt         DateTime @default(now()) @map("scanned_at")
  gateLocation      String?  @map("gate_location")
  notes             String?
  isOutOfTime       Boolean  @default(false) @map("is_out_of_time")
  timeDeviationType String?  @map("time_deviation_type")  // "EARLY" | "LATE"
  deviationReason   String?  @map("deviation_reason")

  pass      VisitorPass @relation(fields: [passId], references: [id])
  scannedBy User        @relation(fields: [scannedById], references: [id])

  @@index([passId])
  @@index([scannedAt])
  @@map("scan_logs")
}

model EmailLog {
  id           String   @id @default(uuid())
  passId       String   @map("pass_id")
  toAddress    String   @map("to_address")
  ccAddresses  Json?    @default("[]") @map("cc_addresses")
  subject      String
  status       String
  errorMessage String?  @map("error_message")
  sentAt       DateTime @default(now()) @map("sent_at")

  pass VisitorPass @relation(fields: [passId], references: [id])

  @@map("email_logs")
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?  @map("user_id")
  action     String
  entityType String   @map("entity_type")
  entityId   String   @map("entity_id")
  changes    Json?
  ipAddress  String?  @map("ip_address")
  createdAt  DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id])

  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

model FeatureFlag {
  id          String   @id @default(uuid())
  key         String   @unique
  enabled     Boolean  @default(false)
  description String?
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("feature_flags")
}

model WhitelistedEmail {
  id         String   @id @default(uuid())
  email      String   @unique
  department String?
  addedBy    String?
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("whitelisted_emails")
}
```

---

## 6. Business Logic & Feature Rules

### Pass Types & Workflows

| Pass Type | Created By | Approval Required | Approver |
|---|---|---|---|
| `EMPLOYEE_GUEST` | Employee | No (by default) | — |
| `OFFICIAL` | Official | No (by default) | — |
| `STUDENT_GUEST` | Student | Yes | OIC_STUDENT_SECTION or ASSISTANT_WARDEN |
| `WALKIN` | Security | No | — (immediate) |
| `STUDENT_EXIT` | Student | Yes | OIC_STUDENT_SECTION |

Approval requirement per pass type is controlled by `FeatureFlag` entries in the DB (managed by Admin). The `src/config/feature-flags.ts` maps flag keys to pass types.

### Pass Status Machine
```
DRAFT → PENDING_APPROVAL → APPROVED → ACTIVE → EXPIRED
                         ↘ REJECTED
APPROVED / ACTIVE → CANCELLED
```
- `WALKIN` passes skip `PENDING_APPROVAL` and go directly to `APPROVED`/`ACTIVE`.
- Once a QR is scanned for first ENTRY, status moves to `ACTIVE`.

### Gate Scan State Machine (`src/services/scan.service.ts`)
The scan service enforces strict sequential integrity — you cannot log an impossible transition:

**Visitor (non-student) scan sequence:**
```
ENTRY → [INTERMEDIATE_EXIT → INTERMEDIATE_ENTRY]* → FINAL_EXIT
```
- Multiple intermediate exits allowed.
- Cannot FINAL_EXIT while currently outside (pending INTERMEDIATE_ENTRY).
- Cannot scan ENTRY twice.

**Student exit scan sequence:**
```
STUDENT_EXIT_OUT → STUDENT_EXIT_RETURN → STUDENT_EXIT_OUT → ...
```
Strictly alternating. Backend blocks any duplicate or out-of-order state.

**Timing deviation tracking:**
- `isOutOfTime: true` when scan happens outside the `visitFrom`–`visitTo` window.
- `timeDeviationType`: `"EARLY"` or `"LATE"`.
- `deviationReason`: optional note captured at scan time.
- Scans are still allowed outside the time window (not blocked); deviation is just recorded.

### Overstaying Detection (`src/app/api/security/overstaying/route.ts`)
- Finds passes where `visitTo` has passed, status is `ACTIVE`, and no `FINAL_EXIT` scan exists.
- Security dashboard polls this endpoint and shows real-time alerts with a click-to-call link on the POC mobile number.

### Walk-in Pass (`src/components/forms/WalkinPassForm.tsx`)
- Created exclusively by `SECURITY`.
- Requires: webcam photo capture (uploaded to Supabase), visitor ID (Aadhaar validated), visitor & security signatures (captured via `react-signature-canvas`).
- Approved instantly — no approval workflow.

### Security "My Passes" Feature (`src/app/(dashboard)/security/passes/page.tsx`)
- Security guards can view passes they personally created (filtered by `createdById`).
- Added in commit `7c2777e` (April 2026).
- Uses `PassList` component with a security-scoped query.

### QR Code System (`src/lib/qr-and-id.ts`)
- Payload is HMAC-signed using `NEXTAUTH_SECRET` as the key.
- `/api/passes/verify` endpoint validates the HMAC before accepting any scan.
- `qrCodeUrl` stores the data URI of the rendered QR image.

### Photo Storage (`src/lib/supabase.ts`, `/api/secure-image/[filename]`)
- Photos and signatures are uploaded to Supabase Object Storage via `/api/upload/photo`.
- Stored file keys (not full URLs) are saved in DB (`visitorPhotoUrl`, `*SignatureUrl`).
- Frontend fetches images through `/api/secure-image/[filename]` which validates the session before proxying the Supabase signed URL. This prevents direct unauthenticated access.

### Email System (`src/services/email.service.ts`)
- Templates per pass type in `src/lib/email-templates/`.
- `EMAIL_TESTING_MODE=true` (env var) reroutes all outgoing emails to a single test address.
- Sending never throws — errors are caught and logged to `EmailLog`.
- CC logic: specific pass types automatically CC institutional office addresses (configured in `src/config/email-config.ts`).

### PDF Generation
- Admin reports use `@react-pdf/renderer` (see `src/app/(dashboard)/admin/reports/ReportPDF.tsx`).
- Print CSS rules hide all Sonner toasts and UI overlays via `[data-sonner-toaster] { display: none }` in `@media print`, so PDFs render cleanly.
- IIT Palakkad institutional logo header is included in the print layout.

### Feature Flags
- Stored in `FeatureFlag` DB table, managed via Admin UI.
- Keys map to pass-type approval requirements.
- `src/config/feature-flags.ts` contains the key constants.

---

## 7. Environment Variables

```env
# PostgreSQL (Supabase)
DATABASE_URL="postgres://postgres.xxx:xxx@xxx.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<random secure string>"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# Email
RESEND_API_KEY="re_xxx"

# Supabase (for file storage)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Used server-side for secure uploads

# Optional
EMAIL_TESTING_MODE="true"           # Reroutes all emails to test address
EMAIL_TEST_RECIPIENT="dev@example.com"
```

---

## 8. Common Development Commands

```bash
npm install                  # Install dependencies
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma migrate dev       # Run migrations against DB
npx prisma studio            # Open Prisma Studio GUI
npm run dev                  # Start local dev server on :3000
```

---

## 9. Architectural Patterns to Follow

1. **API pattern:** All route handlers wrap with `withAuth` / `withRole` / `withValidation` from `src/lib/api-middleware.ts`. Never skip this chain.
2. **Data fetching:** Use React Query hooks in `src/hooks/`. Don't call `fetch()` directly from components.
3. **Validation:** Define Zod schemas in `src/schemas/`, use them on both frontend (react-hook-form) and backend (withValidation).
4. **DB access:** All Prisma logic lives in `src/services/`. API routes call services, not Prisma directly.
5. **Soft deletes:** Set `deletedAt` rather than hard-deleting records. Filter `deletedAt: null` in queries.
6. **State:** Zustand only for minimal UI state. All server data goes through React Query.
7. **Images:** Always upload via `/api/upload/photo` and serve via `/api/secure-image/[filename]`. Never serve Supabase URLs directly to the client.
8. **Emails:** Always use `email.service.ts` — never call Resend directly from routes or services.
9. **Scanner debounce:** The QR scanner debounces duplicate scans on the frontend (~1000ms ref-based debounce). The backend scan service also enforces idempotency via state-machine checks — do not add additional cooldown timers.
10. **Path alias:** `@/*` maps to `src/*` (configured in `tsconfig.json`). Always use this for imports.

---

## 10. Role Dashboard Summary

| Role | Dashboard Path | Key Actions |
|---|---|---|
| `ADMIN` | `/admin` | Full system view, user management, reports, logs, feature flags |
| `EMPLOYEE` | `/employee` | Create & manage own guest passes |
| `OFFICIAL` | `/official` | Create & manage official passes |
| `STUDENT` | `/student` | Create guest & exit passes (requires approval) |
| `SECURITY` | `/security` | Scan QR codes, create walk-in passes, view own passes, see overstaying alerts |
| `OIC_STUDENT_SECTION` | `/oic` | Approve/reject pending student pass requests (inbox model) |
| `ASSISTANT_WARDEN` | `/warden` | Approve student guest passes, receive overstaying alerts |

---

## 11. Recent Changes (April 2026)

- **Supabase Object Storage:** Photos and signatures moved from local `/public/uploads` to Supabase. Served via session-gated `/api/secure-image` proxy.
- **Scan State Machine Hardening:** `ScanService.logScan` rebuilt as a strict state machine. EARLY/LATE deviation tracking written to DB, not computed client-side. `INTERMEDIATE_ENTRY` added to full scan sequence.
- **Date Picker Overhaul:** Native `datetime-local` inputs replaced with Radix + `date-fns` calendar component across all forms. Past-date selection is blocked. "Now" shortcut added.
- **Scanner Debounce Optimization:** Replaced backend cooldown timers with ~1000ms frontend debounce using refs, enabling faster multi-visitor clearance.
- **Print/PDF Fixes:** `@media print` + `@page` CSS hides toasts and UI chrome. Institutional logo added to printed pass layout.
- **Security "My Passes":** New page at `/security/passes` lets security guards view their own created passes.
- **Scan Result Modal:** Updated UI for the post-scan result display.
- **Aadhaar Validation:** Walk-in form validates Aadhaar number format before submission.
- **Sidebar Fix:** Resolved sidebar rendering bugs across multiple iterations.
- **Signature Deprecation:** Manual signature canvas inputs removed from some flows to simplify UX.

---

*End of project knowledge base. Last updated: April 2026.*
