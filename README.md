# IIT Palakkad — Visitor Management System

A full-stack Next.js application that digitizes the complete lifecycle of campus visitor passes: drafting → multi-level approval → encrypted QR generation → security gate scanning.

---

## Features

- **Role-based dashboards** — 7 distinct interfaces (Admin, Employee, Official, Student, Security, OIC, Assistant Warden)
- **Pass types** — Employee Guest, Official, Student Guest, Walk-in, Student Exit
- **Multi-level approval** — OIC/Warden inbox with approve/reject + remarks
- **Encrypted QR codes** — HMAC-signed payloads sent via email; scanned at gate
- **Gate scan state machine** — ENTRY → INTERMEDIATE_EXIT ↔ INTERMEDIATE_ENTRY → FINAL_EXIT; prevents impossible transitions
- **Walk-in capture** — Webcam photo, Aadhaar validation, digital signatures
- **Overstaying alerts** — Real-time polling dashboard with click-to-call links
- **Supabase file storage** — Photos and signatures stored securely; served via session-gated proxy
- **PDF reports** — Admin CSV export and printable pass PDFs
- **Audit trail** — Every action logged with user + IP
- **Feature flags** — Admin can toggle approval requirements per pass type

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| State | Zustand (UI), React Query (server data) |
| Auth | NextAuth v5 — Google OAuth + Credentials |
| Database | PostgreSQL + Prisma ORM |
| File Storage | Supabase Object Storage |
| Email | Resend |
| QR Codes | `qrcode` + `html5-qrcode` |
| Forms | React Hook Form + Zod |
| PDF | `@react-pdf/renderer` |

---

## Prerequisites

Before running the project, make sure you have the following set up.

**System requirements:**
- Node.js 20 or higher
- npm 10 or higher

**External services (all free tiers work):**
- A **PostgreSQL** database — [Supabase](https://supabase.com) recommended (free tier)
- A **Supabase** project — for object storage (photos/signatures)
- A **Google Cloud** project with OAuth 2.0 credentials
- A **Resend** account with a verified sending domain

See [requirements.txt](requirements.txt) for a full checklist.

---

## Local Setup

### 1. Clone the repository

```bash
git clone <repository_url>
cd Visitor-Management-System
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory with the following keys:

```env
# ── Database ────────────────────────────────────────────────────────────────
# Your PostgreSQL connection string (Supabase recommended)
DATABASE_URL="postgres://postgres.<project-ref>:<password>@<host>.pooler.supabase.com:5432/postgres"

# ── NextAuth ─────────────────────────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="<your-random-secret>"

# ── Google OAuth ─────────────────────────────────────────────────────────────
# From Google Cloud Console → APIs & Services → Credentials
GOOGLE_CLIENT_ID="<your-id>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-<your-secret>"

# ── Resend (email) ───────────────────────────────────────────────────────────
RESEND_API_KEY="re_<your-key>"

# ── Supabase (file storage) ──────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# ── Optional ─────────────────────────────────────────────────────────────────
# Redirect all outgoing emails to one address (useful during development)
EMAIL_TESTING_MODE="true"
EMAIL_TEST_RECIPIENT="dev@example.com"
```

### 4. Set up the database

Push the Prisma schema to your database and generate the Prisma client:

```bash
npx prisma generate
npx prisma db push
```

Or if you prefer migrations:

```bash
npx prisma migrate dev --name init
```

### 5. Seed the database (optional but recommended)

Creates initial users, feature flags, and test data:

```bash
npm run db:seed
```

### 6. Create a Security staff account

Security guards log in with email + password (not Google). Run this script to create one:

```bash
npx tsx set-admin-pwd.ts
```

### 7. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login`.

---

## How Authentication Works

| Login Method | Who uses it | Role assigned |
|---|---|---|
| Google OAuth (`@iitpkd.ac.in`) | Faculty / Staff | `EMPLOYEE` |
| Google OAuth (`@smail.iitpkd.ac.in`) | Students | `STUDENT` |
| Google OAuth (whitelisted email) | Officials, OIC, Warden, Admin | Role from DB |
| Email + Password | Security guards | `SECURITY` |

After first Google login, the system auto-creates a user record. For special roles (OIC, Assistant Warden, Admin), add the email to the `WhitelistedEmail` table with the correct role via Prisma Studio:

```bash
npm run db:studio
```

---

## Role Guide

| Role | Dashboard | What they do |
|---|---|---|
| `ADMIN` | `/admin` | Full access — manage users, passes, reports, feature flags, audit logs |
| `EMPLOYEE` | `/employee` | Create and manage employee guest passes |
| `OFFICIAL` | `/official` | Create and manage official visitor passes |
| `STUDENT` | `/student` | Request guest passes and exit passes (requires approval) |
| `SECURITY` | `/security` | Scan QR codes at gate, create walk-in passes, view own passes, see overstaying alerts |
| `OIC_STUDENT_SECTION` | `/oic` | Approve or reject pending student pass requests |
| `ASSISTANT_WARDEN` | `/warden` | Approve student guest passes, view overstaying alerts |

---

## Available Scripts

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type check (no emit)

npm run db:migrate   # Run Prisma migrations (dev)
npm run db:seed      # Seed the database
npm run db:reset     # Reset DB and re-run migrations
npm run db:studio    # Open Prisma Studio GUI
```

---

## Project Structure (key directories)

```
src/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (dashboard)/          # All role dashboards
│   │   ├── admin/
│   │   ├── employee/
│   │   ├── official/
│   │   ├── oic/
│   │   ├── security/
│   │   ├── student/
│   │   └── (roles)/warden/
│   └── api/                  # All backend API routes
├── components/               # React components
├── hooks/                    # React Query hooks
├── lib/                      # Auth, Prisma, email, QR utilities
├── schemas/                  # Zod validation schemas
├── services/                 # Business logic (pass, scan, email, audit)
├── stores/                   # Zustand stores
└── types/                    # TypeScript types
```

For a complete file-by-file breakdown, see [project_details.md](project_details.md).

---

## Deployment (Render + Supabase)

1. Push your code to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
   - Build command: `npm install && npx prisma generate && npm run build`
   - Start command: `npm run start`
3. Add all environment variables from the `.env` section above in Render's Environment tab.
4. Your Supabase PostgreSQL `DATABASE_URL` goes in as well.
5. Make sure your Google OAuth **Authorized redirect URIs** include your Render domain:
   - `https://your-app.onrender.com/api/auth/callback/google`
6. Run migrations on the remote DB after first deploy:
   ```bash
   npx prisma migrate deploy
   ```

---

## Development Notes

- **Emails in development:** Set `EMAIL_TESTING_MODE=true` and `EMAIL_TEST_RECIPIENT` to redirect all emails to one inbox.
- **Prisma Studio:** Run `npm run db:studio` to visually browse and edit database records.
- **Photo serving:** All uploaded photos go to Supabase Storage and are served through `/api/secure-image/[filename]` — never expose Supabase URLs directly.
- **Scanner debounce:** The QR scanner has a ~1000ms frontend debounce to prevent duplicate scans from the same frame. Do not add additional backend cooldowns.
- **Print CSS:** Toasts and UI chrome are hidden via `@media print` rules. Use browser Print / Save as PDF for pass documents.
