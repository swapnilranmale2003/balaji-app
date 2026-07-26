# Balaji — Team Expense Tracker

A transparent ledger for shared team funds. Anyone can visit the site and see how
much has been collected, what it was spent on, and what is left. A single admin
account manages the entries.

- **Public** (`/`) — summary cards, charts, and a searchable expense history. No login.
- **Admin** (`/admin`) — full create / edit / delete for income and expenses.

The remaining balance is never stored. It is always computed as
`Total Received − Total Expenses`.

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
| `npm run db:seed` | Load sample income and expenses |
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
  schema.prisma          Income and Expense models
  seed.ts                Sample data

src/
  app/
    page.tsx             Public dashboard
    login/               Admin login
    admin/
      page.tsx           Admin dashboard
      income/            Income management
      expenses/          Expense management
    actions/             Server Actions (auth, income, expense)
    error.tsx            Error boundary
    not-found.tsx        404

  components/
    dashboard-cards.tsx  The four summary cards
    expense-table.tsx    Search / filter / sort / paginate / export
    income-dialog.tsx    Create and edit income
    expense-dialog.tsx   Create and edit expenses
    delete-dialog.tsx    Delete confirmation
    summary-charts.tsx   Monthly and category charts
    navbar.tsx           Header with mobile sheet menu
    footer.tsx
    ui/                  shadcn/ui components

  lib/
    auth.ts              Sessions, credential checks, route guards
    prisma.ts            Prisma client singleton
    data.ts              Queries and aggregations
    validations.ts       Zod schemas shared by client and server
    constants.ts         Categories and display metadata
    utils.ts             Currency, date, and CSV helpers

  middleware.ts          Redirects unauthenticated users away from /admin
```

---

## Features

**Public view**
- Total Received, Total Expense, Remaining Balance, Total Transactions
- Monthly received-vs-spent chart and a category breakdown
- Expense table with search, category filter, date sorting, and pagination
- CSV export

**Admin**
- Create, edit, and delete both income and expenses
- Confirmation dialog before any delete
- Totals recalculate immediately after every change
- Toast notifications on success and failure

**Throughout**
- Dark mode with a light/dark/system toggle
- Responsive from 390px upward
- Loading skeletons while data streams in
- Validation on both the client and the server

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

---

## Charts and accessibility

Chart colors are assigned from a fixed categorical palette validated for
colour-vision deficiency against both the light and dark surfaces. Series are
always identified by a legend or a direct label, never by colour alone, and the
category breakdown ships an accompanying figure list that doubles as a
text alternative to the chart.
