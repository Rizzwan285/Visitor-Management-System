# IIT Palakkad Visitor Management System

## 1. Project Overview
A comprehensive, web-based security application to streamline pass generation, maintain a centralized visitor database, and track campus entry and exit. Every generated pass must include a QR code for security personnel to scan, verify, and log entry and exit timestamps into the database.

## 2. Authentication and Access Control
Logins are strictly restricted by domain:
* Regular Employees and Faculty: @iitpkd
* Students: @smail
* Official and Generic Accounts: Restricted to a predefined list of allowed users.

## 3. Unique Identifiers
* Students: System will use their institute Roll Number.
* External Visitors: System must generate a unique 10-digit ID.
* Database structure must separate and track visitors per faculty member.

## 4. Pass Categories and Workflows

### Type A: Regular Employees and Faculty
* Workflow: Faculty can generate a pass for a guest directly. No approval is required, though an approval toggle should be built and kept disabled for future use.
* Captured Details: Name, Sex, Purpose, Visit time.
* Routing: A soft copy of the pass is sent to the employee's personal email ID.
* Faculty Dashboard: Faculty need a webpage to view and manage their visitor appointments.

### Type B: Official Emails
* Workflow: Office accounts can generate passes directly without approval.
* Captured Details: Name, Sex, Purpose, Visit time.
* Routing: Soft copy sent to the concerned office email ID, with a CC to the respective Heads.

### Type C: Student Guest and Family Pass
* Workflow: Students can generate a pass for themselves to meet faculty, or for their parents and guests to visit campus. This strictly requires an approval stage by the respective faculty or admin before generation.
* Captured Details: Name, Sex, Relation, Purpose, Age, Visit time.
* Routing: Soft copy sent to the student's email, the Assistant Warden's email, and up to two additional predefined emails.

### Type D: Student Exit Pass
* Workflow: Students generate this when leaving the campus.
* Captured Details: Student name, Purpose, Date and time of exit, Proposed date and time of return, Hostel name.
* Routing: Soft copy sent to the student's email with a CC to the Assistant Warden. Needs a feature to allow further forwarding.

### Type E: Walk-in Visitors
* Workflow: Random visitors arrive at the gate. Security confirms the visit over the phone with the requested faculty or staff. Security then generates the pass on the spot.
* Captured Details: Name, Sex, Mobile number, Age, Purpose, Point of contact, Visit time, Visitor Photo, ID card details, Name of the employee who gave phone confirmation.
* Physical Requirement: Pass needs a spot for the visitor's signature and must be countersigned and sealed by the host.

## 5. QR Code Scanning System
* Scanning the QR code on any pass must immediately pull up a window displaying the visitor's name and all captured details for security to verify.
* The act of scanning and verifying automatically logs the entry and exit record into the central database.

## 6. Future Module: Buggy Tracking
* The application needs a separate module to track institute buggies including Location, ETA, ETD. This is a placeholder for future development.