# Balaji Yatra Company — Expense Tracker

A transparent ledger for shared team funds. Anyone can visit the site and see how
much has been collected, what it was spent on, and what is left. A single admin
account manages the entries.

- **Public** (`/`) — trip totals and spending. No login.
- **Trips** (`/trips`) — every trip with its funds, expenses and balance. No login.
- **Admin** (`/admin`) — create trips, set each trip's received amount, record expenses.

**The trip is the unit of accounting.** Each trip holds its own received
amount, and every expense belongs to a trip. No balance is ever stored — a
trip's balance is always computed as `Received − Spent`, and the portfolio
totals are the sums across trips.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Base UI primitives) |
| Icons | Lucide |
| Database | Prisma 7 ORM — SQLite locally, PostgreSQL in production |
| Mutations | Next.js Server Actions |
| Forms | React Hook Form + Zod |
| Auth | Signed JWT session cookie (`jose`), HTTP-only |
| Charts | Recharts |
| Notifications | Sonner |

---

## Getting started

Requires Node.js 20+ and Docker (for the local database).

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL
docker run -d --name balaji-postgres \
  -e POSTGRES_USER=balaji \
  -e POSTGRES_PASSWORD=balaji_dev_2026 \
  -e POSTGRES_DB=balaji_tracker \
  -p 5435:5432 \
  -v balaji_pgdata:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:16

# 3. Create your environment file
cp .env.example .env

# 4. Create the tables
npm run db:migrate

# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

### Local database

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5435` |
| Database | `balaji_tracker` |
| User | `balaji` |
| Password | `balaji_dev_2026` |

```
postgresql://balaji:balaji_dev_2026@localhost:5435/balaji_tracker?schema=public
```

Port 5435 avoids colliding with a system PostgreSQL on 5432. Browse the data
with `npm run db:studio`, or connect directly:

```bash
docker exec -it balaji-postgres psql -U balaji -d balaji_tracker
```

### The login image

The login screen loads `public/login-hero.jpg` — currently a Himalayan valley
photo. Replace that file to use your own (keep the filename). A portrait
orientation works best, since it fills the left half of the screen.

If you use a photo of identifiable people, make sure everyone pictured is happy
for it to appear on a public page.

### Deploying to Vercel

1. Provision a PostgreSQL database (Vercel Postgres, Neon, or Supabase).
2. In the Vercel project, set the environment variables from `.env.example` —
   `DATABASE_URL` (with `sslmode=require`), `ADMIN_USERNAME`, `ADMIN_PASSWORD`,
   and a fresh `AUTH_SECRET`.
3. Deploy. `postinstall` runs `prisma generate`; apply migrations once with
   `npm run db:deploy` against the production URL.

### Admin credentials

| Field | Value |
|---|---|
| Username | `Kunal` |
| Password | `Kunal@123` |

There is no registration page — this is the only account. Both values come from
`.env`, so change them there rather than in code.

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Connection string. `file:./dev.db` for SQLite. |
| `ADMIN_USERNAME` | yes | Admin login name. |
| `ADMIN_PASSWORD` | yes | Admin password. |
| `AUTH_SECRET` | yes | Signing key for session cookies. **Minimum 32 characters.** |

Generate a production secret with:

```bash
openssl rand -base64 32
```

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:migrate` | Create and apply a migration (dev) |
| `npm run db:deploy` | Apply existing migrations (production) |
| `npm run db:seed` | Clear the database (creates no sample data) |
| `npm run db:studio` | Browse the database in Prisma Studio |

---

## Notes on the database

PostgreSQL is used in both development and production. Prisma 7 requires an
explicit driver adapter, configured in `src/lib/prisma.ts`.

---

## Project structure

```
prisma/
  schema.prisma          Trip and Expense models
  seed.ts                Clears the database (creates no sample data)

src/
  app/
    page.tsx             Public overview
    login/               Admin login
    trips/
      page.tsx           Public trip list
      [id]/              Public trip detail
    admin/
      page.tsx           Admin dashboard
      trips/
        page.tsx         Trip list
        [id]/            Trip detail — expenses and editable received amount
    actions/             Server Actions (auth, trip, expense)

  components/
    stat-row.tsx         Compact figures row
    trip-dialog.tsx      Create and edit trips
    expense-dialog.tsx   Create and edit expenses
    received-editor.tsx  Inline editor for a trip's received amount
    delete-dialog.tsx    Delete confirmation
    navbar.tsx           Header with mobile sheet menu

  lib/
    auth.ts              Sessions, credential checks, route guards
    prisma.ts            Prisma client singleton
    data.ts              Queries and aggregations
    validations.ts       Zod schemas shared by client and server
    constants.ts         Categories and display metadata
    utils.ts             Currency and date helpers

  middleware.ts          Redirects unauthenticated users away from /admin
```

---

## Features

**Trips**
- Create a trip with a name, description, optional dates, and the total amount
  received for it
- The received amount is editable in place from the trip page
- Trip names are unique
- Deleting a trip also deletes its expenses (they have no meaning without it),
  with a confirmation dialog stating how many

**Expenses**
- Recorded against a trip, with a category, amount, date and optional notes
- Searchable and filterable by category within the trip
- Full create / edit / delete, each with validation on client and server

**Public view**
- Portfolio totals: received, spent, remaining balance, trip count
- Per-trip received / spent / balance
- Drill into any trip to see its expenses

**Throughout**
- No sample data — the database ships empty and every figure is real
- Dark mode with a light/dark/system toggle
- Responsive from 390px upward
- Toast notifications on success and failure

---

## Security notes

- Passwords are compared in constant time, so response timing does not leak
  whether the username or the password was wrong.
- Session cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.
- `middleware.ts` redirects unauthenticated visitors, and **every** admin page
  and server action independently calls `requireAdmin()`. Authorization never
  depends on middleware alone.
- The `?from=` login parameter only accepts same-origin paths, so it cannot be
  used as an open redirect.
- CSV exports escape cells beginning with `=`, `+`, `-`, or `@` to prevent
  formula injection in spreadsheet software.

Before deploying, set a strong `AUTH_SECRET` and change `ADMIN_PASSWORD`.
