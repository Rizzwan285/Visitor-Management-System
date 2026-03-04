# VMS Testing & Usage Walkthrough

This document explains how to manually test and use the Visitor Management System (VMS) locally. It describes how to log in, how the different roles interact with the system, and how the various visitor passes work.

## 1. Running the Application

Before testing, ensure your local environment is running:

1. **Start the Database**: Ensure your PostgreSQL instance is running (e.g., via Docker) and `DATABASE_URL` is set in `.env.local`.
2. **Seed the Database**: If you haven't yet, run `npm run db:seed` to populate the test accounts.
3. **Start the Server**: Run `npm run dev` in your terminal.
4. **Access the App**: Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

---

## 2. Test Accounts

The following test accounts are available. All of them use password authentication (or you can use Google OAuth if your email matches the domains configured):

| Role | Email | Password | What they can do |
| :--- | :--- | :--- | :--- |
| **Security** | `security@vms.local` | `security123` | Create walk-in passes, scan QR codes, monitor entries/exits. |
| **Employee** | `john.doe@iitpkd.ac.in` | *(Use Google Sign-In)* | Create employee guest passes, approve passes. |
| **Student** | `student01@smail.iitpkd.ac.in` | *(Use Google Sign-In)* | Create student guest passes, request exit passes. |
| **Official** | `office_cs@iitpkd.ac.in` | *(Use Google Sign-In)* | Create official guest passes. |
| **Admin** | `admin@iitpkd.ac.in` | *(Use Google Sign-In)* | Full access to all dashboards and approvals. |

> **Note on Login**: The `/login` page offers Google OAuth for faculty and students, and a manual "Use Email & Password" fallback specifically for Security guards.

---

## 3. How the Different Passes Work

The VMS handles several specific workflows for different types of visitors:

### A. Employee Guest Pass
- **Who requests it:** Faculty or Employees.
- **Workflow:** An employee requests a pass for their guest. This pass is **auto-approved** (unless the `approval_required_employee_guest` feature flag is turned on).
- **Test it:** Log in as an Employee, click "New Pass", select "Employee Guest", fill in the details. The pass should instantly be active and generate a QR code.

### B. Student Guest Pass
- **Who requests it:** Students.
- **Workflow:** Students request a pass for visiting family or friends. This pass **requires approval** by default.
- **Test it:** Log in as a Student, request a pass for a parent, and select an Employee/Admin as the approver. Then, log in as the assigned Approver (or Admin), go to the "Approvals" dashboard, and "Approve" the request. Once approved, the pass becomes ACTIVE.

### C. Official Guest Pass
- **Who requests it:** Department Officials.
- **Workflow:** Used for official campus visitors (e.g., guest lecturers). Auto-approved.
- **Test it:** Log in as an Official, create the pass. It immediately becomes active for the specified duration.

### D. Walk-in Pass
- **Who requests it:** Security Staff on behalf of an unannounced visitor.
- **Workflow:** When a delivery driver or unannounced visitor arrives at the gate, Security fills out their details, captures their photo (using the integrated webcam feature), and issues a Walk-in pass on the spot.
- **Test it:** Log in with `security@vms.local`. Go to the Dashboard and click "New Walk-in Pass". You can test the webcam capture UI and issue the pass immediately.

### E. Student Exit Pass
- **Who requests it:** Students leaving campus.
- **Workflow:** Students must request an exit pass to log their departure. Can be auto-approved or require warden approval based on settings.
- **Test it:** Log in as a Student, request an Exit Pass, and have Security scan it when leaving.

---

## 4. Testing the Scanning Workflow

The core of the system is the QR scanning pipeline used by Security to let people in and out.

1. **Create an Active Pass**: Log in as any user and create a pass (e.g., Employee Guest). Go to the Pass Details page and you will see a QR Code.
2. **Switch to Security**: Open an Incognito window or a different browser, and log in as `security@vms.local`.
3. **Open Scanner**: Navigate to the **Scan QR** page from the sidebar. 
4. **Simulate a Scan**: 
   - If you have a webcam, you can literally scan the QR code from your phone screen.
   - Alternatively, you can copy the "Pass Number" (e.g., `VMS-20231025-ABCD`) and use the Manual Entry fallback on the Scan page.
5. **Log Entry/Exit**: Once scanned, a modal will pop up with the visitor's details and photo. Click **"Log Entry"**. The visitor is now officially on campus. Later, scan again and click **"Log Exit"**.

## 5. Checking Data Integrity

To confirm the backend is successfully processing everything during your tests:
- Check the **Recent Activity** tables on the dashboards to see new passes appear.
- Open your database GUI (e.g., using pgAdmin, or viewing it via Next.js directly by running `npx prisma studio` in a new terminal tab). Ensure records are being created with the correct timestamps and status enums.
