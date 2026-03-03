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
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Seed test data |
| `npm run db:reset` | Reset DB and re-migrate |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

## Environment Variables
See `.env.example` for all variables with descriptions.

## Project Structure
See implementation_plan.md → Directory Structure section.
