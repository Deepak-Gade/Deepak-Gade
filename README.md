# TutorLink

TutorLink is a tutor discovery and demo-class request application. The React/Vite frontend is paired with an Express API, Prisma ORM, and a local SQLite development database.

## Project structure

```text
src/                         React frontend
  components/                Shared UI, navigation, and route guards
  contexts/                  Authentication state
  data/                      Development seed/reference data
  pages/                     Frontend screens
  services/api.js             API client and response adapters
server/
  prisma/schema.prisma        SQLite development data model
  prisma/migrations/          SQLite development migrations
  prisma/postgresql/          PostgreSQL production schema and migrations
  prisma/seed.js              Development sample data
  src/controllers/            Request handlers
  src/middleware/             Authentication, roles, validation, errors
  src/routes/                 REST route definitions
  src/services/               Matching and notifications
```

## Requirements

- Node.js 20.19+ (Vite 8 requirement)
- npm

## Setup

Install the frontend and backend dependencies from the project root:

```bash
npm install
npm --prefix server install
```

For local development, copy `server/.env.example` to `server/.env` and set a unique random `JWT_SECRET`. SQLite remains the local default and Vite proxies `/api` to the local API.

```env
# server/.env
DATABASE_URL="file:./dev.db"
DATABASE_PROVIDER=sqlite
JWT_SECRET="your-own-random-secret"
JWT_EXPIRES_IN="7d"
PORT=5000
FRONTEND_URL="http://127.0.0.1:5173"
CORS_ORIGIN="http://localhost:5173,http://127.0.0.1:5173"
NODE_ENV=development
```

## Database

Apply checked-in migrations and generate Prisma Client:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

The database file is created at `server/prisma/dev.db` and is ignored by Git. After changing `schema.prisma`, create a named development migration with:

```bash
npm --prefix server run prisma:migrate:dev -- --name describe_change
```

Then apply it with `npm run prisma:migrate`.

## Run the app

Start the Vite frontend and Express backend together:

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:5000/api>
- Health check: <http://localhost:5000/api/health>

Run either process on its own with `npm run dev:web` or `npm run dev:api`.

## Authentication and development accounts

Registration supports `STUDENT` and `TUTOR`; admin accounts are provisioned by the seed script. Passwords are hashed with bcrypt. Login returns a signed JWT. The frontend stores that token in `localStorage` for this development implementation and sends it as a bearer token.

Development seed accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@tutorlink.com` | `Admin@123` |
| Student | `aarav@example.com` | `Student@123` |
| Tutor | `maya@tutorlink.com` | `Tutor@123` |

These credentials are for local development only. All seeded tutor accounts use `Tutor@123`; all seeded students use `Student@123`.

## API overview

- `GET /api/health`
- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- Tutors: `GET /api/tutors`, `GET /api/tutors/:id`, `POST|PUT /api/tutors/profile`, `GET /api/tutors/me/profile`
- Requirements and matches: `/api/requirements`, `/api/requirements/me`, `/api/matches/:requirementId`
- Demo requests: `POST /api/demo-requests`, student/tutor lists, request detail, and status updates
- Saved tutors and notifications: `/api/saved-tutors`, `/api/notifications`
- Dashboards: `GET /api/student/dashboard`, `GET /api/tutor/dashboard`
- Admin (ADMIN role required): analytics dashboard, tutor review, student search, student requirements, demo-request lists/details/status updates under `/api/admin`

Tutor discovery filters include `class`, `subject`, `location`, `teachingMode`, `minFee`, `maxFee`, `minExperience`, and `verified`. Recommendations always return verified tutors. The directory defaults to verified tutors and can show other review states when the verified-only filter is cleared. Matching is a transparent rule-based score: class 25%, subject 25%, teaching mode 15%, location 15%, budget 10%, and experience 10%; results include the criteria that contributed to each score. It is not AI-generated.

## PostgreSQL production setup

The production schema is kept at `server/prisma/postgresql/schema.prisma`, with its own PostgreSQL migration history. It mirrors the application models. The SQLite schema, generated client, migrations, and local database remain separate. Do not change the SQLite `DATABASE_URL` or run PostgreSQL migration commands against the local database.

Create an empty PostgreSQL database and obtain its host, port, database name, username, password, and TLS requirements from the provider. URL-encode special characters in the username and password. Use this connection URL shape:

```env
DATABASE_PROVIDER=postgresql
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public&sslmode=require"
JWT_SECRET="<unique random value with at least 32 bytes of entropy>"
PORT=5000
FRONTEND_URL="https://app.example.com"
CORS_ORIGIN="https://app.example.com"
NODE_ENV=production
```

The root `.env.example` is a production template with placeholders, not usable credentials. Set backend values through the deployment environment or `server/.env`. Set `VITE_API_URL` at frontend build time to the deployed API URL ending in `/api`. `CORS_ORIGIN` accepts a comma-separated allowlist; `FRONTEND_URL` is also allowed by the API. Never commit populated environment files.

### Safe migration workflow

The PostgreSQL initial migration creates tables on a new, empty PostgreSQL database. It does not import or modify local SQLite records. Run these commands with the PostgreSQL environment variables configured:

```bash
npm run prisma:validate:postgres
npm run prisma:generate:postgres
npm run prisma:migrate:deploy:postgres
```

For future schema changes, create migrations against an isolated development PostgreSQL database with `npm --prefix server run prisma:migrate:dev:postgres -- --name describe_change`. Review and commit the migration SQL, apply it to staging, then run `npm run prisma:migrate:deploy:postgres` in production. Do not run `migrate dev`, `db push`, or reset commands against production. Back up the database before production migrations.

Run `npm run prisma:generate:postgres` in the deployment build/release job before starting `npm --prefix server start`. The runtime selects the separate generated PostgreSQL client when `DATABASE_PROVIDER=postgresql`; unset or set it to `sqlite` to use the local SQLite client. Production seed mode provisions only the admin configured by `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (minimum 16 characters); it does not create sample accounts.

## Current scope

The application is integrated with the real API. Local development uses SQLite; PostgreSQL schema and migration support are prepared for production. Hosting, email/SMS, Google sign-in, payments, maps, and file uploads are not configured. Tutor reviews are not part of the current data model, so the UI reports when a tutor has no reviews instead of inventing ratings.

