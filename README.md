# Visitor Management System (VMS)

A comprehensive, role-based Visitor Management System built for Indian Institute of Technology Palakkad (IITPKD). This application handles digital visitor passes, multi-level approvals, automated email notifications, and entry/exit QR code scanning.

## 🌟 Key Features

- **Role-Based Access Control:** Distinct dashboards and permissions for Students, Employees, Officials, Security personnel, and Administrators.
- **Pass Requests & Approvals:** Students can request guest passes, which are automatically routed to the designated Warden or Approver.
- **Digital QR Passes:** Approved passes generate a securely crypted QR code that can be sent to visitors via email.
- **Security Checkpoint Scanning:** Security personnel can scan QR codes at gates to register entry and exit timestamps.
- **Real-Time Dashboards:** Instant visibility into active visitors, pending approvals, and historical logs.
- **Automated Emails:** Integration with Resend to automatically dispatch pass status updates and QR tickets.
- **Secure Authentication:** NextAuth integration supporting both institutional Google Workspace SSO (OAuth) and Admin credentials.

---

## 💻 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Hosted on Supabase)
- **ORM:** Prisma
- **Styling:** Tailwind CSS & Shadcn UI
- **Authentication:** NextAuth.js v5 (Google OAuth + Credentials)
- **State Management:** Zustand & React Query
- **Form Validation:** React Hook Form & Zod
- **Email Service:** Resend

---

## 📂 Project Directory Structure

```text
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets (fonts, images)
├── scripts/                 # Utility scripts for DB import/export and admin management
├── src/
│   ├── app/                 # Next.js App Router pages and API endpoints
│   │   ├── (auth)/          # Login routes
│   │   ├── (dashboards)/    # Role-specific dashboard pages
│   │   └── api/             # Backend API routes (passes, auth, scans)
│   ├── components/          # Reusable UI components (Shadcn, generic)
│   ├── config/              # Application configuration (domains, feature flags)
│   ├── lib/                 # Core utilities (Prisma client, NextAuth, fetch wrappers)
│   └── services/            # Business logic (pass creation, email templates)
├── .env                     # Environment variables configuration
└── package.json             # Project dependencies and scripts
```

---

## 🔐 Role-Based Access

The system enforces strict route protection through Next.js Middleware based on 5 roles:

1. **ADMIN** (`/admin`): Full system access, feature flag toggling, and environment configuration.
2. **SECURITY** (`/security`): Access to QR scanning interfaces and live campus visitor logs.
3. **EMPLOYEE** (`/employee`): Can instantly create pre-approved visitor passes and view their own visitor history.
4. **STUDENT** (`/student`): Can create guest requests, which are placed in a `PENDING_APPROVAL` queue for wardens.
5. **OFFICIAL** (`/official`): Can review, approve, or reject student pass requests.

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js**: v18 or newer
- **PostgreSQL**: Local instance or Supabase account
- **Google Cloud Console**: OAuth credentials configured for `localhost:3000`

### 1. Clone the repository
```bash
git clone https://github.com/Rizzwan285/Visitor-Management-System.git
cd Visitor-Management-System
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file referencing the structure below:
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# NextAuth
NEXTAUTH_URL=http://localhost:3000 # ⚠️ MUST be your live domain (e.g., https://app.onrender.com) in production!
NEXTAUTH_SECRET=generate_a_strong_random_secret

# Google OAuth
# ⚠️ Your Google Cloud Console must have the exact NEXTAUTH_URL added as an Authorized Redirect URI!
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Resend Mail
RESEND_API_KEY=your_resend_hook
EMAIL_FROM=onboarding@resend.dev
```

### 4. Database Initialization
Push the Prisma schema to your requested database:
```bash
npx prisma db push
```

### 5. Start the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to access the login terminal.

---

## 📝 Script Utilities

The `scripts/` directory contains useful tools to manage database environments:
- `set-admin-pwd.ts`: Force resets a specific user's login password.
- `export_local_data.py`: Dumps local PostgreSQL rows into a JSON format.
- `safe_import.ts`: Ingests the JSON dump securely into a remote Supabase instance via Prisma insertions. 
