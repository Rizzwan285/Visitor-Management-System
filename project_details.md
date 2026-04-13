# Visitor Management System - Complete Developer Context & Architecture Dump

This document serves as a comprehensive **Knowledge Base and Context Dump** for the Visitor Management System. It is designed to be fed directly into an LLM (Large Language Model) to give it 100% awareness of the project's logic, underlying technologies, file structure, configurations, and core constraints. 

If you are an LLM reading this, treat this document as the supreme source of truth regarding the application’s current state.

---

## 1. Project Objective and Overview
**Name:** IIT Palakkad Visitor Management System  
**Goal:** Digitize the logging, request, and tracking of visitors (Guests, Officials, Walk-ins) and inter-campus movement of students using QR-code-based passes.
**Current Hosting:** The application is deployed on **Render** utilizing a **Supabase PostgreSQL** instance for the database.
**Auth Provider:** Exclusively Google OAuth.
**Mail Provider:** Resend SDK.

---

## 2. Technology Stack & Dependencies
This project is built as a Full-Stack application using the **Next.js App Router (v14/15)**.

* **Core Framework:** Next.js, React 19.
* **Language:** TypeScript (`strict` mode).
* **Styling Ecosystem:**
  * Tailwind CSS (v4) via `@tailwindcss/postcss`.
  * Components are structured using **Shadcn UI**, **Radix UI**, and `class-variance-authority`.
  * Merging utilities: `clsx`, `tailwind-merge`.
  * Icons: `lucide-react`.
* **State Management & Data Fetching:**
  * Client-side State: `zustand`
  * API / Async State: `@tanstack/react-query`
* **Authentication:** NextAuth (`next-auth@5.0.0-beta.30`) securely wired with `@auth/prisma-adapter`.
* **Database & ORM:** PostgreSQL managed via **Prisma ORM** (`@prisma/client` and `prisma` dev dependency).
* **Form Logic & Validation:**
  * `react-hook-form`
  * `zod` schema validations and `@hookform/resolvers`
* **Mailing:** `resend` SDK.
* **Additional Utilities:**
  * `qrcode` & `html5-qrcode` (For code code generation and device camera scanning).
  * `date-fns` (time manipulation).
  * `@react-pdf/renderer` (Document issuance).
  * `react-signature-canvas` (Capturing security/visitor signatures directly on frontend).

---

## 3. Directory & Routing Architecture

The Next.js App Router (`src/app`) splits routing aggressively based on Access Roles.

### Key Directories
* `src/app/api/`: Holds backend endpoints executing Prisma queries (`auth`, `dashboard`, `passes`, `reports`, `scan-logs`, `security`, `upload`, `users`, `warden`).
* `src/app/(auth)`: Holds unauthenticated logic or callback routes (e.g. `/login`).
* `src/app/(dashboard)`: Houses protected interfaces for exact roles.
  - `/admin`: Root system administrators.
  - `/employee`: Standard faculty/staff routing.
  - `/official`: External/Internal generic VIP routing.
  - `/oic`: Officer In Charge dashboards (Student section).
  - `/security`: Security gate dashboard (Scanning UI, manual entries, out logic).
  - `/student`: Student dashboard (Initiating guest passes, exit passes).
  - `/warden`: Assistant Warden interfaces (Approving student guest passes).
* `src/components/`: Reusable React components (Atoms, Forms, Modals).
* `src/hooks/`: Custom React hooks mapping to React-Query endpoints.
* `src/lib/`: Essential non-react code (`auth.config.ts`, `prisma.ts`, `email.ts`, `auth-utils.ts`, `qr.ts`).
* `src/schemas/`: `Zod` validation definitions explicitly separating frontend validation logic from DB logic.

---

## 4. Authentication Flow & Middleware Restrictions

Authentication is driven completely by **Google Auth** mapping users to predefined roles.

### Allowed Domains
1. `@iitpkd.ac.in` inherently map to `EMPLOYEE` logic or designated administration roles.
2. `@smail.iitpkd.ac.in` inherently map to `STUDENT` logic.
3. *Exceptions:* Generic institutional emails (`office_cs@iitpkd.ac.in`) are checked against a **Whitelist** (`WhitelistedEmail` table) bypassing domain locks.

### Route Protection Middleware (`src/middleware.ts`)
The `ROUTE_ROLE_MAP` configures hard gates across navigation:
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
If a NextAuth session lacks the specific `session.user.role`, it generates a `307 Redirect` to `/login?error=AccessDenied`. Custom JWT session assignment happens in `src/lib/auth.config.ts`.

---

## 5. Complete Database Schema (Prisma)

LLM context rule: The exact underlying database structure is defined by the following `schema.prisma`. All logic you write must adhere to these exact relations.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ──────────────────────────────────────────────
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
  FINAL_EXIT
  STUDENT_EXIT_OUT
  STUDENT_EXIT_RETURN
}

enum Sex {
  MALE
  FEMALE
  OTHER
}

// ─── Models ─────────────────────────────────────────────
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String?
  role         Role
  rollNumber   String?  @map("roll_number")
  uniqueId     String?  @map("unique_id")
  department   String?
  passwordHash String?  @map("password_hash") // Used primarily for seeder/local dev
  avatarUrl    String?  @map("avatar_url")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  deletedAt    DateTime? @map("deleted_at")

  createdPasses     VisitorPass[]      @relation("CreatedPasses")
  hostedPasses      VisitorPass[]      @relation("HostedPasses")
  approvalRequests  ApprovalRequest[]  @relation("RequestedApprovals")
  approvedRequests  ApprovalRequest[]  @relation("ApprovedRequests")
  scanLogs          ScanLog[]
  auditLogs         AuditLog[]

  @@map("users")
}

model VisitorPass {
  id                String      @id @default(uuid())
  passNumber        String      @unique @map("pass_number")
  passType          PassType    @map("pass_type")
  status            PassStatus  @default(DRAFT)
  createdById       String      @map("created_by_id")
  visitorName       String      @map("visitor_name")
  visitorSex        Sex         @map("visitor_sex")
  purpose           String
  visitFrom         DateTime    @map("visit_from")
  visitTo           DateTime    @map("visit_to")
  visitorRelation   String?     @map("visitor_relation")
  visitorAge        Int?        @map("visitor_age")
  visitorMobile     String?     @map("visitor_mobile")
  visitorIdType     String?     @map("visitor_id_type")
  visitorIdNumber   String?     @map("visitor_id_number")
  visitorPhotoUrl   String?     @map("visitor_photo_url")
  phoneConfirmedBy  String?     @map("phone_confirmed_by")
  pointOfContact    String?     @map("point_of_contact")
  pocMobile         String?     @map("poc_mobile")
  hostelName        String?     @map("hostel_name")
  qrCodeData        String      @map("qr_code_data")
  qrCodeUrl         String?     @map("qr_code_url")
  approvalRequired  Boolean     @default(false) @map("approval_required")
  hostProfessorId   String?     @map("host_professor_id")
  ccEmails          Json?       @default("[]") @map("cc_emails")
  emailSentTo       Json?       @default("[]") @map("email_sent_to")
  emailSent         Boolean     @default(false) @map("email_sent")
  
  // Signatures
  visitorSignatureUrl  String?  @map("visitor_signature_url")
  securitySignatureUrl String?  @map("security_signature_url")
  hostSignatureUrl     String?  @map("host_signature_url")
  countersignUrl       String?  @map("countersign_url")
  
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")
  deletedAt         DateTime?   @map("deleted_at")

  createdBy       User              @relation("CreatedPasses", fields: [createdById], references: [id])
  hostProfessor   User?             @relation("HostedPasses", fields: [hostProfessorId], references: [id])
  approvalRequest ApprovalRequest?
  scanLogs        ScanLog[]
  emailLogs       EmailLog[]

  @@index([passType])
  @@index([status])
  @@index([createdById])
  @@index([hostProfessorId])
  @@map("visitor_passes")
}

model ApprovalRequest {
  id            String          @id @default(uuid())
  passId        String          @unique @map("pass_id")
  requestedById String          @map("requested_by_id")
  approverId    String?         @map("approver_id")
  status        ApprovalStatus  @default(PENDING)
  remarks       String?
  decidedAt     DateTime?       @map("decided_at")
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  pass        VisitorPass @relation(fields: [passId], references: [id])
  requestedBy User        @relation("RequestedApprovals", fields: [requestedById], references: [id])
  approver    User?       @relation("ApprovedRequests", fields: [approverId], references: [id])

  @@map("approval_requests")
}

model ScanLog {
  id           String    @id @default(uuid())
  passId       String    @map("pass_id")
  scannedById  String    @map("scanned_by_id")
  scanType     ScanType  @map("scan_type")
  scannedAt    DateTime  @default(now()) @map("scanned_at")
  gateLocation String?   @map("gate_location")
  notes        String?

  pass      VisitorPass @relation(fields: [passId], references: [id])
  scannedBy User        @relation(fields: [scannedById], references: [id])

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
  id          String   @id @default(uuid())
  email       String   @unique
  department  String?
  addedBy     String?
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("whitelisted_emails")
}
```

---

## 6. Business Logic & Feature Constraints

### Visitor Flow Specifications
* **Student Passes (Student Guest / Student Exit):**
  * When a student issues a request, `VisitorPass` receives status `PENDING_APPROVAL` and generates a mapped `ApprovalRequest`.
  * The `ASSISTANT_WARDEN` role intercepts this request in their dashboard. When approved, a QR pass is formally generated and dispatched via the Resend API to both the student and the Warden automatically.
  * *Important Context:* Signatures are historically skipped for student workflows as logic verifies approval explicitly against the DB.
* **Employee / Internal Operations (VIP / Officials):**
  * Typically, the frontend logic bypasses initial approval workflows based on the active role issuing the pass. (`approvalRequired = false`).
  * CC Logic: Emails are automatically duplicated (`cc_addresses`) corresponding to designated office/head constraints via generic arrays.
* **Walk-In Visitors:**
  * Issued uniquely by `SECURITY` with instantaneous approval.
  * Involves heavy UI elements tracking manual uploads of face captures (`visitorPhotoUrl`), validating identity documents (`visitorIdType`), taking physical user signatures digitally (`react-signature-canvas`), and generating an immediate QR entry point representation.

### Event Tracking & Security Logic
* **Scans Mapping:**
  * `ScanLog` acts as the definitive historical ledger. Passes transitioning out track via `ScanType: FINAL_EXIT`. Passes stepping out briefly track `INTERMEDIATE_EXIT`.
* **Known Edge Case — OIC Student Section:**
  * When an officer logged into the `/oic` path handles an approval/rejection request, the request immediately terminates from visibility across their interface.
  * Currently, the system lacks an isolated historical table specific for OIC view history; treating tasks as purely inbox (zero-sum) processing.

---

## 7. Environment Requirements (.env Setup)

To spin up this repository locally (and identical parameters required inside **Render**'s deployment portal):

```env
# Database Connections
DATABASE_URL="postgres://postgres.xxx:xxx@xxx.pooler.supabase.com:5432/postgres"

# Next Auth Secrets
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="A highly secure random string generated locally"

# Google Client Credentials for Login
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# Mail Transaction Logic
RESEND_API_KEY="re_xxx"
```

## 8. Terminal Commands Executed

* Installed Dependencies: `npm install`
* Synced Database Schema: `npx prisma generate` (to build types). The Database is remote, thus `migrate deploy` commands act directly against Supabase.
* Startup routine: `npm run dev`

---

## 9. Recent Architectural & Production Upgrades (April 2026 Phase)

The application underwent rigorous hardening and aesthetic upgrades directly matching the developer's personal layout aesthetics:
* **Supabase Object Storage Migration:** Ripped out local ephemeral `/public/uploads` usage. Now dynamically proxies photo buffers leveraging `@supabase/supabase-js` via a bespoke highly secured `/api/secure-image` routing bridge requiring active session validations.
* **Chronological Integrity Constraints:** Upgraded schemas logically with Zod and strictly added database-level constraints `check_visit_dates` ensuring `visitTo` strictly sequentially follows `visitFrom`.
* **Component Engine Substitution:** Gutted ugly native browser generic `datetime-local` blocks across five major form components, replacing them entirely with a custom Radix-powered, `date-fns` supported Calendar layout.
* **Complete UI/UX Theme Sync (`devmittal.me` Base):** Rebuilt the generic Tailwind global variables completely from scratch using the explicit minimalist design layout from the user's primary engineering portfolio portfolio. Light mode explicitly leverages pure #ffffff minimal interfaces wrapped with dark-blue sidebars, whilst Dark mode maps standardly against `neutral-950` deep blacks and highly accessible `violet-600` primary buttons heavily avoiding bloated shadows or gradients natively driven by `next-themes`.
* **Signature Deprecation:** Safely severed all frontend demands for the generic manual user signature input canvases, simplifying security inputs cleanly.

---
**End of Project Knowledge Base.**
