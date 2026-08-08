# Balaji — Team Expense Tracker

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

Requires Node.js 20 or newer.

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env

# 3. Create the database and tables
npm run db:migrate

# 4. (Optional) Load sample data
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open <http://localhost:3000>.

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

## Switching to PostgreSQL

SQLite is the default so the project runs with no external services. To move to
PostgreSQL:

1. Set the provider in `prisma/schema.prisma`:

   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```

2. Install the adapter and swap it in `src/lib/prisma.ts`:

   ```bash
   npm install @prisma/adapter-pg
   ```

   ```ts
   import { PrismaPg } from "@prisma/adapter-pg";
   const adapter = new PrismaPg({ connectionString: url });
   ```

   Prisma 7 requires an explicit driver adapter, which is why this step is needed.

3. Point `DATABASE_URL` at your instance and run `npm run db:migrate`.

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
