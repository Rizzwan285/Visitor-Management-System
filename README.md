# Visitor Management System (VMS)

A robust, full-stack Next.js application designed to manage, track, and approve visitor passes efficiently.

## Project Overview
The VMS digitizes the entire lifecycle of visitor passes—from drafting and multi-level approval to QR code generation and live security gate scanning. It offers specialized dashboards tailored to different roles (Admin, Security, Student, Employee, Official) to streamline operations, enhance campus security, and provide real-time reporting on pass lifecycles.

## Implemented Features
- **Role-Based Dashboards:** Unique UI views and features for Admins, Security, Employees, Officials, Students, and the distinct **Officer-in-Charge (OIC)**.
- **Dynamic Pass Generation:** Different workflows for Guest Passes, Exit Passes, and Walk-ins.
- **Multi-Level Approvals:** Granular permission system for passing pending requests through required approvers (e.g. Host professors and Student Section Officiants).
- **Advanced Walk-in Capture:** Physical webcam implementations combined with a multi-tiered **3-signature digital pad** (Visitor, Security, Host) tracking physical walk-in validity securely.
- **Secure QR Code Generation:** Real-time generation of encrypted QR codes distributed via Email API to visitors for seamless security scanning, explicitly bypassing email image strippers via direct raw-byte proxies.
- **Scanner Workflows:** Security guards can scan QR codes logging both `ENTRY`, `INTERMEDIATE_EXIT`, and `FINAL_EXIT`. Dedicated overlays allow isolating **`STUDENT_EXIT_OUT`** and **`STUDENT_EXIT_RETURN`** pipelines completely explicitly alerting Assistant Wardens automatically.
- **Security Analytics & Alerts:** Security Dashboard includes real-time feeds of gate operations and an active alert tracker for Overstaying Visitors directly querying DB checkpoints.
- **Admin Reporting Engine:** A powerful data visualization UI for exporting custom-timeline analytical CSV reports.

## Tech Stack
- **Frontend Framework:** Next.js 14 (App Router)
- **UI & Styling:** Tailwind CSS, shadcn/ui components, Lucide icons
- **State & Data Fetching:** React Query (@tanstack/react-query)
- **Backend Architecture:** Next.js API Routes (Serverless)
- **Database & ORM:** PostgreSQL managed via Prisma ORM
- **Authentication:** NextAuth.js (v5) securely handling Google OAuth and local credential sign-ins.
- **Email Delivery:** Resend API

## Setup and Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd Visitor_Management_System
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Configure Environment Variables:**
   Rename `.env.example` to `.env` and fill out your local values (refer to `todo.md` for specific service-level setups).

4. **Initialize Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. **Seed the database (Optional but recommended):**
   ```bash
   npx tsx prisma/seed.ts
   ```

6. **Start the local server:**
   ```bash
   npm run dev
   ```

## Usage Instructions
- **Administrators**: Access `/admin` to view full analytical reports, override approval decisions, or monitor real-time event logs via the dashboard.
- **Security Accounts**: Login via email/password combination on the root page. From the Security Dashboard `/security`, guards can issue walk-in passes with camera-captured photos or utilize the camera-scanner UI to log entries and final-exits.
- **Host Officials/Students**: Utilize the "Create Pass" forms from your respective dashboards. Track the real-time approval status of pending passes.

## Deployment Details
This application is designed for serverless execution and scales effortlessly on **Render** or **Vercel** with a remotely hosted PostgreSQL database instance (such as **Supabase**).

- **Database:** Connect your preferred PostgreSQL provider and export the `DATABASE_URL` during deployment.
- **Email:** Create a **Resend** account and configure a verified domain to send email payloads (set `RESEND_API_KEY`).
- Follow the manual deployment parameters and secrets instructions outlined entirely within `todo.md` (Not tracked by Git) internally inside the root folder to spin up production easily!
