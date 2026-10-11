# Saraiki Student Council

A production-minded multilingual website and member platform for the Saraiki Student Council at Leads University, Lahore.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Express-compatible API shell
- MongoDB Atlas / Mongoose-ready data layer
- Vitest + Testing Library

## Local setup

1. Install dependencies:
   npm install
2. Copy environment variables:
   cp .env.example .env
3. Start development services:
   npm run dev
4. Open the frontend at http://localhost:5173
5. API health checks are served at http://localhost:4000/api/v1/health
6. Create the first staff account in an interactive terminal with `npm run admin:create`.
7. Verify SMTP connectivity without sending a message with `npm run email:verify`.

## Membership workflow

- Students submit applications at `/join`; student ID is unique and each application starts in the pending queue.
- Staff sign in at `/council/review` to filter, approve, or decline applications. A reason is required for declines.
- The first administrator is created with `npm run admin:create`; the password is entered without echo and stored as an Argon2 hash.
- On approval, an account is created and the applicant receives a localized email with a single-use, 48-hour activation link. Failed email delivery is recorded for staff retry.
- SMTP settings support `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE` and the corresponding lowercase names (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_from`, `smtp_secure`).
- Public enquiries are stored in the staff inbox at `/council/inbox`; set `CONTACT_TO` (or `contact_to`) to the council mailbox for SMTP delivery.
- Admin and editor roles can review applications. Council-specific eligibility, privacy wording, and membership rules should be confirmed before launch.
- Event managers and admins can publish events, set capacity, and view attendee lists. Members and public students can register.
- Admins and editors can create/edit/publish announcements, culture articles, and leadership profiles in `/council/content`.
- Admins and event managers can open volunteer calls and review member applications in `/council/volunteers`.
- Members can activate their account from email, sign in at `/member`, view their profile/event registrations, and apply to volunteer.
- Contact submissions are stored and visible in `/council/inbox`; staff can follow up even if mail delivery is temporarily unavailable.

## Scripts

- npm run dev
- npm run build
- npm run typecheck
- npm run lint
- npm run test:run
- npm run test:api
- npm run admin:create
- npm run email:verify

## Milestones

Implementation status follows the milestone plan in the project brief.

- Milestone 1: project setup, design system, and routing shell
- Milestone 2: public multilingual pages
- Milestone 3: models, API foundation, auth, and authorization
- Milestone 4: membership workflow
- Milestone 5: events, capacity-aware registrations, and attendee management implemented
- Milestone 6: announcement, culture-story, and leadership CMS implemented
- Milestone 7: member activation/portal and volunteer workflow implemented
- Milestone 8: API/UI tests and core security controls implemented; final policy/security review remains
- Milestone 9: setup documentation present; production hosting and deployment target remain to be selected

## Notes

- The initial project setup is a foundation for the full council platform.
- Database credentials and production secrets must never be committed.
- Real council content, student records, and approved cultural assets must be supplied before launch.
- Set `APP_URL` to the deployed frontend origin and configure `CORS_ORIGIN` with that exact origin.
- Set `CONTACT_TO` (or `contact_to`) to the council inbox. Confirm `npm run email:verify` succeeds before relying on automated mail.
- Production must use a long random `SESSION_SECRET`, HTTPS, a managed MongoDB deployment, and a reviewed privacy/retention policy.
