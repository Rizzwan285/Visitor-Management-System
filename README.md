# IIT Palakkad — Gate Security & Visitor Management System

## What This Is
A full-stack web application designed for campus gate security management. It handles visitor passes, QR code scanning, multi-stage approval workflows (e.g., student exit passes and guest requests), and audit trails.

## Prerequisites
- Node.js 18+
- PostgreSQL 15+ (running locally)
- Google Cloud project with OAuth 2.0 credentials (add `http://localhost:3000/api/auth/callback/google` as redirect URI)

## Quick Start (Running Locally)

1. **Clone this repo**
2. **Install dependencies**: `npm install`
3. **Environment Setup**: Copy `.env.example` to `.env.local` and fill in all values:
   - `DATABASE_URL` — your PostgreSQL connection string
   - `NEXTAUTH_SECRET` — a random 32-character string
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud
   - `QR_HMAC_SECRET` — a random 32-character string
4. **Run migrations**: `npm run db:migrate`
5. **Seed the database**: `npm run db:seed`
6. **Start the local server**: `npm run dev`
7. **Access the application**: Open [http://localhost:3000](http://localhost:3000)

## Seeded Test Accounts

The following test accounts are available after running `npm run db:seed`. All use password authentication (or Google OAuth if the email matches the domain).

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **SECURITY** | `security@vms.local` | `security123` | Create walk-in passes, scan QR codes, monitor entries/exits |
| **EMPLOYEE** | `employee@iitpkd.ac.in` | *(Google OAuth)* | Create employee guest passes, approve passes |
| **STUDENT** | `student@smail.iitpkd.ac.in` | *(Google OAuth)* | Create student guest passes, request exit passes |
| **OFFICIAL** | `official@iitpkd.ac.in` | *(Google OAuth)* | Create official guest passes |
| **ADMIN** | `admin@iitpkd.ac.in` | *(Google OAuth)* | Full access to all dashboards and approvals |

> **Login Note**: The `/login` page offers Google OAuth for faculty and students, and a manual "Use Email & Password" fallback specifically for Security guards.

## How the Different Passes Work

The VMS handles specific workflows for different types of visitors:

- **Employee Guest Pass**: Requested by Faculty/Employees. Auto-approved by default unless the respective feature flag is restricted.
- **Student Guest Pass**: Requested by Students for family/friends. **Requires approval** from an assigned Approver (Faculty/Admin). Once the assigned approver logs in and approves it, the pass becomes active.
- **Official Guest Pass**: Requested by Department Officials for campus visitors (e.g., guest lecturers). Auto-approved.
- **Walk-in Pass**: Created on the spot by Security Staff at the gate for unannounced visitors or deliveries. Includes live HTML5 webcam integration to capture guest photos.
- **Student Exit Pass**: Requested by students leaving campus. Security scans it upon departure.

## Testing the QR Scanning Workflow (Security)

The core functionality is the QR scanning pipeline.
1. Log in as an Employee or Student, create an active pass, and open the Pass Details page to view the QR Code.
2. Open an Incognito window and log in as **Security** (`security@vms.local`).
3. Navigate to **Scan QR** from the sidebar.
4. Scan the QR code using a webcam, or manually enter the "Pass Number" (e.g., `VMS-20231025-XXXX`).
5. A modal will pop up displaying the visitor's details and photo. Click **"Log Entry"** or **"Log Exit"** to record the movement in the database.

## Available Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Seed test data |
| `npm run db:reset` | Reset DB and re-migrate |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

## Render Deployment Note
To deploy this project as a Web Service on Render, ensure the root directory is empty, and use the following build command to generate the Prisma Client and migrate the production database:
`npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
