# IIT Palakkad — Gate Security & Visitor Management System

## Implementation Plan

> **Version**: 1.0  
> **Date**: 2026-03-03  
> **Status**: Draft — awaiting review

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Database Schema](#3-database-schema)
4. [Backend Structure](#4-backend-structure)
5. [API Contracts](#5-api-contracts)
6. [Frontend Structure](#6-frontend-structure)
7. [Deployment Workflow](#7-deployment-workflow)

---

## 1. Project Overview

### 1.1 Problem Statement

IIT Palakkad's campus gate security currently lacks a unified digital system for visitor management. Passes are handled ad-hoc, there is no centralized visitor database, and QR-based verification is absent. This creates bottlenecks at entry/exit points and makes audit trails unreliable.

### 1.2 Solution

A production-ready, full-stack web application that:

- Implements domain-restricted authentication with role-based access control (RBAC)
- Supports 5 distinct pass-generation workflows (Employee Guests, Official/Contract Staff, Student Guests, Walk-in Visitors, Student Exit)
- Generates QR codes on every pass for contactless scanning
- Provides a dedicated Security Dashboard for QR scanning, verification, and entry/exit logging
- Maintains a centralized, auditable visitor database
- Sends automated email notifications with soft-copy passes

### 1.3 Core User Roles

| Role | Domain / Method | Dashboard |
|------|----------------|-----------|
| Regular Employee | `@iitpkd.ac.in` | Employee Dashboard |
| Student | `@smail.iitpkd.ac.in` | Student Dashboard |
| Official/Generic Account | Whitelisted emails (e.g., `personnel@`, `office_cs@`, `IPTIF`, `Techin`) | Official Dashboard |
| Security Personnel | Dedicated login | Security Dashboard |
| Admin/Approver | Faculty/Staff with approve permissions | Admin/Approver Dashboard |

### 1.4 Pass Types

| Type | Workflow | Approval Required | Key Extras |
|------|----------|-------------------|------------|
| A — Employee Guest | Employee invites visitor | No (flag exists) | Email to employee |
| B — Official/Contract | Office invites visitor | No (flag exists) | Email to office + CC dept heads |
| C — Student Guest | Student invites parent/guest | **Yes** — faculty/admin | Email to student + Asst. Warden + 2 CC |
| D — Walk-in | Security creates on-site | N/A (phone confirm) | Photo, ID card, signature blocks, print layout |
| E — Student Exit | Student leaving campus | No | Email to student + CC Asst. Warden, forward button |

---

## 2. Architecture Decisions

### 2.1 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | Next.js 14 (App Router) + TypeScript | SSR/SSG, API routes, file-based routing, strong typing |
| **Styling** | Tailwind CSS v3 + shadcn/ui | Rapid UI development, accessible component library |
| **State Management** | Zustand + TanStack Query v5 | Lightweight global state + server-state caching |
| **Forms & Validation** | React Hook Form + Zod | Performant forms with schema-based validation |
| **Backend / API** | Next.js API Routes (Route Handlers) | Co-located with frontend, serverless-friendly |
| **ORM** | Prisma | Type-safe DB access, migrations, introspection |
| **Database** | PostgreSQL 15+ | Relational integrity, JSON support, production-grade |
| **Authentication** | NextAuth.js v5 (Auth.js) | Domain-restricted OAuth (Google), credential-based for security staff |
| **Email** | Resend (or Nodemailer + SMTP) | Transactional emails with HTML templates |
| **QR Code** | `qrcode` (server-side generation) | Embed QR as data-URL in pass PDFs/views |
| **QR Scanning** | `html5-qrcode` (client-side) | Browser-based camera scanner for Security Dashboard |
| **PDF Generation** | `@react-pdf/renderer` | Server-side and client-side PDF rendering for print-ready passes |
| **File Storage** | Local filesystem (dev) / S3-compatible (prod) | Walk-in visitor photos |
| **Deployment** | Docker Compose → VPS or AWS ECS | Containerized for reproducibility |
| **CI/CD** | GitHub Actions | Lint → Test → Build → Deploy pipeline |

### 2.2 Architectural Pattern

```
┌──────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP                           │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Frontend    │    │  API Routes  │    │  Middleware   │   │
│  │  (React/TSX) │───▶│  (Route      │◀──▶│  (Auth,RBAC, │   │
│  │              │    │  Handlers)   │    │   Logging)   │   │
│  └──────────────┘    └──────┬───────┘    └──────────────┘   │
│                             │                                │
│                      ┌──────▼───────┐                        │
│                      │   Services   │                        │
│                      │  (Business   │                        │
│                      │   Logic)     │                        │
│                      └──────┬───────┘                        │
│                             │                                │
│                      ┌──────▼───────┐                        │
│                      │   Prisma     │                        │
│                      │   (ORM)      │                        │
│                      └──────┬───────┘                        │
└─────────────────────────────┼────────────────────────────────┘
                              │
                       ┌──────▼───────┐
                       │ PostgreSQL   │
                       │  Database    │
                       └──────────────┘
```

### 2.3 Key Architectural Principles

1. **Layered Separation**: Route Handlers → Service Layer → Prisma/DB. No direct Prisma calls in route handlers.
2. **Shared Validation**: Zod schemas shared between frontend forms and API validation.
3. **Feature Flags**: `approval_required` and other toggles stored in DB config table.
4. **Audit Trail**: Every pass creation, update, scan, and approval is logged with timestamps and actor IDs.
5. **Soft Deletes**: Passes and users are never hard-deleted; use `deletedAt` timestamp.

### 2.4 Authentication Flow

```mermaid
flowchart TD
    A[User visits /login] --> B{User Type?}
    B -->|Employee/Student/Official| C[Google OAuth]
    B -->|Security Personnel| D[Username/Password]
    C --> E{Email Domain Check}
    E -->|@iitpkd.ac.in| F[Role: EMPLOYEE]
    E -->|@smail.iitpkd.ac.in| G[Role: STUDENT]
    E -->|Whitelisted| H[Role: OFFICIAL]
    E -->|Not recognized| I[Access Denied]
    D --> J{Credentials Valid?}
    J -->|Yes| K[Role: SECURITY]
    J -->|No| I
    F & G & H & K --> L[Session Created → Dashboard]
```

### 2.5 Directory Structure

```
Visitor_Management_System/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── employee/
│   │   │   │   ├── page.tsx              # Employee dashboard
│   │   │   │   └── passes/
│   │   │   │       ├── new/page.tsx      # Create pass (Workflow A)
│   │   │   │       └── [id]/page.tsx     # View pass details
│   │   │   ├── student/
│   │   │   │   ├── page.tsx              # Student dashboard
│   │   │   │   ├── guest-pass/
│   │   │   │   │   └── new/page.tsx      # Workflow C
│   │   │   │   └── exit-pass/
│   │   │   │       └── new/page.tsx      # Workflow E
│   │   │   ├── official/
│   │   │   │   ├── page.tsx              # Official dashboard
│   │   │   │   └── passes/
│   │   │   │       └── new/page.tsx      # Workflow B
│   │   │   ├── security/
│   │   │   │   ├── page.tsx              # Security dashboard
│   │   │   │   ├── scan/page.tsx         # QR scanner view
│   │   │   │   └── walkin/
│   │   │   │       └── new/page.tsx      # Workflow D
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx              # Admin dashboard
│   │   │   │   └── approvals/page.tsx    # Pending approval queue
│   │   │   └── layout.tsx                # Shared dashboard layout + sidebar
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/route.ts
│   │   │   ├── passes/
│   │   │   │   ├── route.ts              # GET (list), POST (create)
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts          # GET, PATCH, DELETE
│   │   │   │   │   ├── approve/route.ts  # POST (approve/reject)
│   │   │   │   │   └── scan/route.ts     # POST (log entry/exit)
│   │   │   │   └── verify/route.ts       # GET ?code=<qr_payload>
│   │   │   ├── users/
│   │   │   │   └── route.ts
│   │   │   ├── scan-logs/
│   │   │   │   └── route.ts
│   │   │   └── upload/
│   │   │       └── photo/route.ts        # Walk-in photo upload
│   │   ├── layout.tsx                    # Root layout
│   │   ├── page.tsx                      # Landing / redirect
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                           # shadcn/ui primitives
│   │   ├── forms/
│   │   │   ├── EmployeePassForm.tsx
│   │   │   ├── OfficialPassForm.tsx
│   │   │   ├── StudentGuestPassForm.tsx
│   │   │   ├── WalkinPassForm.tsx
│   │   │   └── StudentExitPassForm.tsx
│   │   ├── passes/
│   │   │   ├── PassCard.tsx
│   │   │   ├── PassDetail.tsx
│   │   │   ├── PassQRCode.tsx
│   │   │   └── PassPrintLayout.tsx
│   │   ├── scanner/
│   │   │   ├── QRScanner.tsx
│   │   │   └── ScanResultModal.tsx
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   └── RecentActivity.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   ├── auth.ts                       # NextAuth config
│   │   ├── prisma.ts                     # Prisma client singleton
│   │   ├── email.ts                      # Email sending utilities
│   │   ├── qr.ts                         # QR code generation
│   │   ├── pdf.ts                        # PDF generation
│   │   ├── id-generator.ts              # 10-digit unique ID generator
│   │   └── constants.ts                  # Whitelisted emails, domains, roles
│   ├── services/
│   │   ├── pass.service.ts               # Pass CRUD + business logic
│   │   ├── approval.service.ts           # Approval workflow
│   │   ├── scan.service.ts               # QR scan + entry/exit logging
│   │   ├── email.service.ts              # Email template rendering + sending
│   │   └── user.service.ts               # User management
│   ├── schemas/
│   │   ├── pass.schema.ts                # Zod schemas for all pass types
│   │   ├── user.schema.ts
│   │   └── scan.schema.ts
│   ├── types/
│   │   ├── pass.types.ts
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   ├── hooks/
│   │   ├── usePasses.ts
│   │   ├── useScanner.ts
│   │   └── useApprovals.ts
│   ├── stores/
│   │   └── ui.store.ts                   # UI state (sidebar, modals)
│   └── config/
│       ├── domains.ts                    # Allowed email domains
│       ├── feature-flags.ts              # approval_required, etc.
│       └── email-config.ts               # SMTP / Resend config
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── schemas/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│       └── cypress/ (or playwright/)
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── nginx.conf
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 3. Database Schema

### 3.1 Entity-Relationship Diagram

```mermaid
erDiagram
    User ||--o{ VisitorPass : creates
    User ||--o{ ApprovalRequest : approves
    VisitorPass ||--o| ApprovalRequest : requires
    VisitorPass ||--o{ ScanLog : scanned_at
    User ||--o{ ScanLog : scanned_by

    User {
        uuid id PK
        string email UK
        string name
        enum role "EMPLOYEE | STUDENT | OFFICIAL | SECURITY | ADMIN"
        string rollNumber "nullable, students only"
        string uniqueId "10-digit, non-students"
        string department "nullable"
        string passwordHash "nullable, security only"
        string avatarUrl "nullable"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "nullable, soft delete"
    }

    VisitorPass {
        uuid id PK
        string passNumber UK "auto-generated, readable"
        enum passType "EMPLOYEE_GUEST | OFFICIAL | STUDENT_GUEST | WALKIN | STUDENT_EXIT"
        enum status "DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | ACTIVE | EXPIRED | CANCELLED"
        uuid createdById FK
        string visitorName
        enum visitorSex "MALE | FEMALE | OTHER"
        string purpose
        datetime visitFrom
        datetime visitTo
        string visitorRelation "nullable, Workflow C"
        int visitorAge "nullable, Workflow C & D"
        string visitorMobile "nullable, Workflow D"
        string visitorIdType "nullable, Workflow D"
        string visitorIdNumber "nullable, Workflow D"
        string visitorPhotoUrl "nullable, Workflow D"
        string phoneConfirmedBy "nullable, Workflow D"
        string pointOfContact "nullable, Workflow D"
        string hostelName "nullable, Workflow E"
        string qrCodeData "encoded payload for QR"
        string qrCodeUrl "data-URL of generated QR image"
        boolean approvalRequired "default false"
        uuid hostProfessorId FK "nullable, links to specific professor"
        string ccEmails "JSON array of CC addresses"
        string emailSentTo "JSON array of sent-to addresses"
        boolean emailSent "default false"
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "nullable"
    }

    ApprovalRequest {
        uuid id PK
        uuid passId FK UK
        uuid requestedById FK
        uuid approverId FK "nullable until assigned"
        enum status "PENDING | APPROVED | REJECTED"
        string remarks "nullable"
        datetime decidedAt "nullable"
        datetime createdAt
        datetime updatedAt
    }

    ScanLog {
        uuid id PK
        uuid passId FK
        uuid scannedById FK "security personnel"
        enum scanType "ENTRY | EXIT"
        datetime scannedAt
        string gateLocation "nullable"
        text notes "nullable"
    }

    EmailLog {
        uuid id PK
        uuid passId FK
        string toAddress
        string ccAddresses "JSON array"
        string subject
        enum status "SENT | FAILED | PENDING"
        string errorMessage "nullable"
        datetime sentAt
    }

    AuditLog {
        uuid id PK
        uuid userId FK "nullable"
        string action
        string entityType
        uuid entityId
        json changes "before/after snapshot"
        string ipAddress
        datetime createdAt
    }

    FeatureFlag {
        uuid id PK
        string key UK
        boolean enabled
        string description
        datetime updatedAt
    }
```

### 3.2 Prisma Schema (Key Models)

```prisma
// prisma/schema.prisma

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
  EXIT
}

enum Sex {
  MALE
  FEMALE
  OTHER
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String
  role         Role
  rollNumber   String?   @unique
  uniqueId     String?   @unique
  department   String?
  passwordHash String?
  avatarUrl    String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  deletedAt    DateTime?

  createdPasses    VisitorPass[]     @relation("CreatedPasses")
  hostedPasses     VisitorPass[]     @relation("HostedPasses")
  approvalRequests ApprovalRequest[] @relation("Approver")
  sentRequests     ApprovalRequest[] @relation("Requester")
  scanLogs         ScanLog[]
  auditLogs        AuditLog[]

  @@map("users")
}

model VisitorPass {
  id               String     @id @default(uuid())
  passNumber       String     @unique
  passType         PassType
  status           PassStatus @default(DRAFT)
  createdById      String
  createdBy        User       @relation("CreatedPasses", fields: [createdById], references: [id])
  visitorName      String
  visitorSex       Sex
  purpose          String
  visitFrom        DateTime
  visitTo          DateTime
  visitorRelation  String?
  visitorAge       Int?
  visitorMobile    String?
  visitorIdType    String?
  visitorIdNumber  String?
  visitorPhotoUrl  String?
  phoneConfirmedBy String?
  pointOfContact   String?
  hostelName       String?
  qrCodeData       String
  qrCodeUrl        String?
  approvalRequired Boolean    @default(false)
  hostProfessorId  String?
  hostProfessor    User?      @relation("HostedPasses", fields: [hostProfessorId], references: [id])
  ccEmails         Json?      @default("[]")
  emailSentTo      Json?      @default("[]")
  emailSent        Boolean    @default(false)
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  deletedAt        DateTime?

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
  id            String         @id @default(uuid())
  passId        String         @unique
  pass          VisitorPass    @relation(fields: [passId], references: [id])
  requestedById String
  requestedBy   User           @relation("Requester", fields: [requestedById], references: [id])
  approverId    String?
  approver      User?          @relation("Approver", fields: [approverId], references: [id])
  status        ApprovalStatus @default(PENDING)
  remarks       String?
  decidedAt     DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@map("approval_requests")
}

model ScanLog {
  id           String   @id @default(uuid())
  passId       String
  pass         VisitorPass @relation(fields: [passId], references: [id])
  scannedById  String
  scannedBy    User     @relation(fields: [scannedById], references: [id])
  scanType     ScanType
  scannedAt    DateTime @default(now())
  gateLocation String?
  notes        String?

  @@index([passId])
  @@index([scannedAt])
  @@map("scan_logs")
}

model EmailLog {
  id           String   @id @default(uuid())
  passId       String
  pass         VisitorPass @relation(fields: [passId], references: [id])
  toAddress    String
  ccAddresses  Json?    @default("[]")
  subject      String
  status       String   @default("PENDING")
  errorMessage String?
  sentAt       DateTime @default(now())

  @@map("email_logs")
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String
  entityType String
  entityId   String
  changes    Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}

model FeatureFlag {
  id          String   @id @default(uuid())
  key         String   @unique
  enabled     Boolean  @default(false)
  description String?
  updatedAt   DateTime @updatedAt

  @@map("feature_flags")
}
```

---

## 4. Backend Structure

### 4.1 Service Layer Architecture

```
src/services/
├── pass.service.ts        # Core CRUD for all pass types
├── approval.service.ts    # Approval workflow (create, approve, reject)
├── scan.service.ts        # QR verification + entry/exit logging
├── email.service.ts       # Template rendering + Resend/SMTP dispatch
├── user.service.ts        # User lookup, creation, role management
├── qr.service.ts          # QR payload encoding/decoding
├── pdf.service.ts         # PDF generation for all pass types
└── audit.service.ts       # Audit log creation
```

### 4.2 Service Contracts (Key Methods)

#### PassService

```typescript
class PassService {
  // Create a pass of any type, applying workflow-specific validation
  async createPass(data: CreatePassInput, userId: string): Promise<VisitorPass>;

  // Get pass by ID with all relations
  async getPassById(id: string): Promise<VisitorPass | null>;

  // List passes with filtering and pagination
  async listPasses(filters: PassFilters, page: number, limit: number): Promise<PaginatedResult<VisitorPass>>;

  // Update pass details (only if status allows)
  async updatePass(id: string, data: UpdatePassInput): Promise<VisitorPass>;

  // Soft-delete / cancel a pass
  async cancelPass(id: string, userId: string): Promise<void>;

  // Generate unique pass number: VMS-YYYYMMDD-XXXX
  private generatePassNumber(): string;
}
```

#### ApprovalService

```typescript
class ApprovalService {
  // Create approval request (auto-triggered for Workflow C)
  async createApprovalRequest(passId: string, approverId: string): Promise<ApprovalRequest>;

  // Approve a pass
  async approvePass(requestId: string, approverId: string, remarks?: string): Promise<void>;

  // Reject a pass
  async rejectPass(requestId: string, approverId: string, remarks: string): Promise<void>;

  // Get pending approvals for a specific approver
  async getPendingApprovals(approverId: string): Promise<ApprovalRequest[]>;
}
```

#### ScanService

```typescript
class ScanService {
  // Verify QR payload and return pass details
  async verifyQRCode(qrPayload: string): Promise<VisitorPass>;

  // Log an entry or exit scan
  async logScan(passId: string, securityId: string, type: ScanType, gate?: string): Promise<ScanLog>;

  // Get scan history for a pass
  async getScanHistory(passId: string): Promise<ScanLog[]>;
}
```

### 4.3 Middleware Stack

| Middleware | Purpose | Applied To |
|-----------|---------|-----------|
| `withAuth` | Validates session, extracts user | All `/api/*` except auth |
| `withRole(roles[])` | Checks user role against allowed list | Role-specific endpoints |
| `withValidation(schema)` | Validates request body against Zod schema | POST/PATCH endpoints |
| `withAudit` | Logs action to AuditLog | All mutating endpoints |
| `withRateLimit` | Rate limiting per IP/user | All endpoints |

### 4.4 QR Code Payload Design

The QR code encodes a signed, URL-safe payload:

```
Format:  VMS:<passId>:<checksum>
Example: VMS:a1b2c3d4-e5f6-7890-abcd-ef1234567890:x7k9m2
```

- `passId` is the UUID of the pass
- `checksum` is a HMAC-SHA256 truncated hash using a server secret, preventing QR forgery
- On scan, the security dashboard calls `GET /api/passes/verify?code=VMS:...` which validates the checksum and returns full pass details

---

## 5. API Contracts

### 5.1 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/auth/session` | Get current session | — |
| `POST` | `/api/auth/signin` | Google OAuth / Credentials | — |
| `POST` | `/api/auth/signout` | End session | Authenticated |

### 5.2 Passes

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| `POST` | `/api/passes` | Create a new pass | ✅ | ALL (type-restricted) |
| `GET` | `/api/passes` | List passes (paginated, filtered) | ✅ | ALL (scoped) |
| `GET` | `/api/passes/:id` | Get pass details | ✅ | Owner, Security, Admin |
| `PATCH` | `/api/passes/:id` | Update pass | ✅ | Owner (if editable) |
| `DELETE` | `/api/passes/:id` | Cancel/soft-delete pass | ✅ | Owner, Admin |
| `GET` | `/api/passes/verify` | Verify QR code payload | ✅ | Security |

#### `POST /api/passes` — Request Body (Workflow A: Employee Guest)

```json
{
  "passType": "EMPLOYEE_GUEST",
  "visitorName": "John Doe",
  "visitorSex": "MALE",
  "purpose": "Project Discussion",
  "visitFrom": "2026-03-10T09:00:00Z",
  "visitTo": "2026-03-10T17:00:00Z"
}
```

#### `POST /api/passes` — Request Body (Workflow C: Student Guest)

```json
{
  "passType": "STUDENT_GUEST",
  "visitorName": "Parent Name",
  "visitorSex": "FEMALE",
  "visitorRelation": "Mother",
  "visitorAge": 52,
  "purpose": "Campus Visit",
  "visitFrom": "2026-03-15T10:00:00Z",
  "visitTo": "2026-03-15T18:00:00Z",
  "approverId": "faculty-uuid-here"
}
```

#### `POST /api/passes` — Request Body (Workflow D: Walk-in)

```json
{
  "passType": "WALKIN",
  "visitorName": "Walk-in Person",
  "visitorSex": "MALE",
  "visitorMobile": "9876543210",
  "visitorAge": 35,
  "purpose": "Delivery",
  "pointOfContact": "Dr. Smith",
  "phoneConfirmedBy": "Prof. Johnson",
  "visitorIdType": "Aadhar",
  "visitorIdNumber": "1234-5678-9012",
  "visitorPhotoUrl": "/uploads/photos/abc123.jpg",
  "visitFrom": "2026-03-10T10:00:00Z",
  "visitTo": "2026-03-10T12:00:00Z"
}
```

#### `POST /api/passes` — Request Body (Workflow E: Student Exit)

```json
{
  "passType": "STUDENT_EXIT",
  "visitorName": "Self",
  "visitorSex": "MALE",
  "purpose": "Weekend trip home",
  "hostelName": "Nila Hostel",
  "visitFrom": "2026-03-14T16:00:00Z",
  "visitTo": "2026-03-16T20:00:00Z"
}
```

#### Standard Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142
  },
  "error": null
}
```

#### Error Response

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Visitor name is required",
    "details": [
      { "field": "visitorName", "message": "Required" }
    ]
  }
}
```

### 5.3 Approvals

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| `GET` | `/api/passes/:id/approve` | Get approval status | ✅ | Owner, Approver, Admin |
| `POST` | `/api/passes/:id/approve` | Approve or reject | ✅ | Approver, Admin |

#### `POST /api/passes/:id/approve` — Request Body

```json
{
  "action": "APPROVE",
  "remarks": "Approved for campus visit"
}
```

### 5.4 Scanning & Entry/Exit

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| `POST` | `/api/passes/:id/scan` | Log entry/exit scan | ✅ | Security |
| `GET` | `/api/scan-logs` | List all scan logs (filtered) | ✅ | Security, Admin |

#### `POST /api/passes/:id/scan` — Request Body

```json
{
  "scanType": "ENTRY",
  "gateLocation": "Main Gate",
  "notes": ""
}
```

### 5.5 Users

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| `GET` | `/api/users` | List users (for approver selection) | ✅ | ALL |
| `GET` | `/api/users/me` | Get current user profile | ✅ | ALL |

### 5.6 File Upload

| Method | Endpoint | Description | Auth | Roles |
|--------|----------|-------------|------|-------|
| `POST` | `/api/upload/photo` | Upload walk-in visitor photo | ✅ | Security |

---

## 6. Frontend Structure

### 6.1 Page Routing Map

| Route | Page | Role Access | Description |
|-------|------|------------|-------------|
| `/login` | Login | Public | Google OAuth + Security credentials |
| `/employee` | Employee Dashboard | EMPLOYEE | Stats, recent passes, quick actions |
| `/employee/passes/new` | Create Pass | EMPLOYEE | Workflow A form |
| `/employee/passes/:id` | Pass Detail | EMPLOYEE | View pass with QR |
| `/student` | Student Dashboard | STUDENT | Stats, guest & exit passes |
| `/student/guest-pass/new` | Guest Pass | STUDENT | Workflow C form |
| `/student/exit-pass/new` | Exit Pass | STUDENT | Workflow E form |
| `/official` | Official Dashboard | OFFICIAL | Stats, recent passes |
| `/official/passes/new` | Create Pass | OFFICIAL | Workflow B form |
| `/security` | Security Dashboard | SECURITY | Scan button, recent scans, walkin |
| `/security/scan` | QR Scanner | SECURITY | Camera-based QR scanning |
| `/security/walkin/new` | Walk-in Pass | SECURITY | Workflow D form |
| `/admin` | Admin Dashboard | ADMIN | All passes, approvals, reports |
| `/admin/approvals` | Approval Queue | ADMIN | Pending approvals list |

### 6.2 Component Architecture

```
Components are organized by feature domain:

forms/        → One form component per workflow (5 total)
passes/       → Shared pass display components
scanner/      → QR scanning + result modal
dashboard/    → Shared dashboard widgets (stats, activity)
layout/       → Header, Sidebar, Footer
ui/           → shadcn/ui primitives (Button, Input, Dialog, etc.)
```

### 6.3 Key UI Specifications

#### Login Page
- Split layout: Left panel with illustration/branding, right panel with login
- Google OAuth button for employees/students/officials
- Collapsible "Security Login" section with username/password fields
- Domain validation feedback on email input

#### Dashboard Layout
- Responsive sidebar navigation (collapsible on mobile)
- Top bar with user info, notifications bell, logout
- Main content area with breadcrumbs

#### Pass Creation Forms
- Multi-step or single-page form depending on workflow complexity
- Real-time validation with inline error messages
- Date/time pickers with timezone awareness (IST)
- Workflow D: Integrated webcam capture for visitor photo

#### Pass Detail View
- Card layout showing all pass information
- Prominent QR code display
- Status badge (color-coded)
- Action buttons: Print, Email, Cancel (based on status)
- Scan history timeline

#### Security Scanner
- Full-screen camera view with QR overlay guide
- On successful scan: Modal with visitor details, ENTRY/EXIT toggle, confirm button
- On failed scan: Error feedback with retry

#### Print Layout (Workflow D)
- Dedicated print-optimized CSS (`@media print`)
- Signature block for visitor
- Counter-signature block for host with official seal placeholder
- All captured details in a formal layout

### 6.4 State Management

| Store | Library | Purpose |
|-------|---------|---------|
| `ui.store.ts` | Zustand | Sidebar open/close, active modal, theme |
| Server State | TanStack Query | Passes, approvals, users — cached, auto-refetched |
| Form State | React Hook Form | Controlled per form instance |

---

## 7. Local Development & Setup

> [!NOTE]
> The immediate focus is on a fully functional local development environment. Production-ready deployment (Docker, VPS, etc.) is planned as a secondary phase.

### 7.1 Local Environment Configuration

```env
# .env.local

# Database (Local PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/vms_db

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=a-secure-random-string-for-local-dev

# Google OAuth (For local testing)
# Note: You need to set up a project in Google Cloud Console
# and add http://localhost:3000/api/auth/callback/google as a redirect URI
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Resend or local development - e.g. Mailtrap/MailHog)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@localhost

# QR Code
QR_HMAC_SECRET=your-local-hmac-secret

# File Upload (Local)
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880

# Feature Flags
APPROVAL_REQUIRED_STUDENT_GUEST=true
```

### 7.2 Running Locally

1. **Prerequisites**:
   - Node.js 18+
   - PostgreSQL 15+ running locally
2. **Setup**:
   - `npm install`
   - Create `.env.local` based on `.env.example`
   - `npx prisma migrate dev`
   - `npx prisma db seed`
3. **Execution**:
   - `npm run dev`
   - Open `http://localhost:3000`

### 7.3 Future Deployment (Phase 2)

Once the local implementation is verified, the following production assets are prepared:

- **Dockerization**: Ready-to-use Dockerfile and docker-compose.yml for containerized deployment.
- **CI/CD**: GitHub Actions pipeline for automated linting, testing, and building.
- **Production DB**: Transition to a managed PostgreSQL instance or hardened on-premise server.
- **S3 Storage**: Optional transition from local uploads to S3-compatible storage for photos.


---

## 8. Non-Functional Requirements

| Requirement | Target |
|------------|--------|
| Response Time | < 500ms for API endpoints |
| Concurrent Users | 100+ simultaneous |
| Uptime | 99.5% |
| Data Retention | Visitor records kept for 3 years |
| Security | HTTPS, CSRF protection, input sanitization, rate limiting |
| Accessibility | WCAG 2.1 AA compliance |
| Browser Support | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Mobile | Responsive design, PWA-ready |
