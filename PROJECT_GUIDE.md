# Balaji Yatra Expense Tracker — Project Guide

A plain-English walkthrough of what this project is, how every piece works, and
why each choice was made. Written for someone who has not seen the code before.

**Live site:** <https://balaji-app-noj1.vercel.app>
**Repository:** <https://github.com/swapnilranmale2003/balaji-app>

---

## Table of contents

1. [What the app does](#1-what-the-app-does)
2. [The tech stack, explained](#2-the-tech-stack-explained)
3. [How the app is organised](#3-how-the-app-is-organised)
4. [The database](#4-the-database)
5. [Prisma in depth](#5-prisma-in-depth)
6. [Docker](#6-docker)
7. [Neon](#7-neon)
8. [Vercel](#8-vercel)
9. [Authentication](#9-authentication)
10. [How a click becomes saved data](#10-how-a-click-becomes-saved-data)
11. [Problems we hit and what caused them](#11-problems-we-hit-and-what-caused-them)
12. [Everyday commands](#12-everyday-commands)
13. [Still to do](#13-still-to-do)

---

## 1. What the app does

A shared-fund tracker for a yatra company. Money is collected for a trip, spent
on that trip, and everyone can see where it went.

**The trip is the unit of accounting.** Each trip holds its own pot of money:

```
Trip: Tirupati Darshan
  Received  ₹40,000   ← money collected for this trip
  Spent     ₹15,000   ← sum of its expenses
  Balance   ₹25,000   ← calculated, never stored
```

Two kinds of people use it:

| | Admin | Everyone else |
|---|---|---|
| Log in | Yes, one account | No login needed |
| See totals and expenses | Yes | Yes |
| Create/edit/delete | Yes | No |

The public side is deliberately open — that is the point of the app. Anyone can
audit the numbers without an account.

### The balance is never stored

There is no `balance` column anywhere. It is computed on every read:

```
balance = received − sum(expenses)
```

**Why this matters.** If you stored the balance, you would have to remember to
update it every time an expense changed. Miss one path — an edit, a delete, a
failed transaction — and the stored number quietly disagrees with the expenses
it claims to summarise. That is the classic accounting bug, and the only
reliable fix is to not store it at all.

---

## 2. The tech stack, explained

Each layer, what it does, and why it is here.

### Next.js 15 — the framework

React on its own only runs in the browser. Next.js adds a server: it renders
pages before sending them, handles routing, and lets you write server code
alongside your components.

**App Router** means folders become URLs:

```
src/app/page.tsx            →  /
src/app/trips/page.tsx      →  /trips
src/app/trips/[id]/page.tsx →  /trips/anything   ([id] = a wildcard)
src/app/admin/page.tsx      →  /admin
```

**Server Components** are the important idea. A page marked `async` runs *on the
server*. It can query the database directly — no API endpoint, no `fetch`, no
loading spinner:

```tsx
export default async function TripsPage() {
  const trips = await getTripsWithTotals();   // real SQL, on the server
  return <div>{trips.map(...)}</div>;         // HTML sent to the browser
}
```

The database credentials never reach the browser, because that code never runs
there.

### TypeScript — catching mistakes before they run

JavaScript with type labels. `trip.recieved` (misspelled) is an error at build
time rather than `undefined` at 2am.

### Tailwind CSS — styling

Instead of writing separate CSS files, you put small utility classes directly on
elements:

```tsx
<div className="flex items-center gap-2 rounded-lg border p-4">
```

`flex` = lay children in a row, `gap-2` = space between them, `p-4` = padding.
Verbose to read, but you never hunt through a stylesheet wondering what a class
does or whether deleting it breaks another page.

### shadcn/ui — components you own

Buttons, dialogs, tables, dropdowns. Unusually, these are **copied into your
project** rather than installed as a package — they live in
`src/components/ui/`. You can edit them freely; there is no library version to
fight with.

### Prisma — talking to the database

An ORM: you describe your tables once, and it generates type-safe functions.

```ts
// Instead of writing SQL strings:
const trips = await prisma.trip.findMany({ include: { expenses: true } });
```

TypeScript then knows `trips[0].expenses[0].amount` is a number. Misspell a
field and it fails to compile.

### PostgreSQL — the database

A relational database: data in tables with defined columns and enforced
relationships. Chosen because money needs consistency guarantees — a half-saved
expense is not acceptable.

### Zod — validating input

Never trust data arriving from a browser. Zod describes what is acceptable, and
rejects everything else:

```ts
amount: z.coerce.number().positive("Amount must be greater than 0")
```

The same rules run in the browser (fast feedback) *and* on the server (actual
enforcement). Someone bypassing the form still cannot save a negative expense.

### React Hook Form — form handling

Tracks what you typed, what is invalid, and whether it is currently submitting,
without re-rendering the whole page on every keystroke.

### jose — signing session tokens

Creates and verifies JWTs. Used for the login cookie. Works in Next.js
middleware, which many crypto libraries do not.

### Other pieces

| Package | Job |
|---|---|
| `lucide-react` | Icons |
| `sonner` | Toast notifications ("Trip created") |
| `next-themes` | Dark mode |
| `tailwind-merge` + `clsx` | Combining class names without conflicts |
| `server-only` | Build error if server code is imported into the browser |

---

## 3. How the app is organised

```
src/
  app/                        Pages and server actions
    page.tsx                  /          public overview
    login/                    /login     admin sign-in
    trips/
      page.tsx                /trips     public: every trip + its expenses
      [id]/page.tsx           /trips/x   public: one trip
    admin/
      page.tsx                /admin     dashboard
      trips/page.tsx          /admin/trips
      trips/[id]/page.tsx     /admin/trips/x   edit a trip and its expenses
    actions/                  Server Actions — the only code that writes
      auth.ts                 login, logout
      trip.ts                 create/update/delete trip, edit received
      expense.ts              create/update/delete expense

  components/                 Reusable UI
    navbar.tsx  footer.tsx  stat-row.tsx
    trip-dialog.tsx           create/edit a trip
    expense-dialog.tsx        create/edit an expense
    received-editor.tsx       inline edit of the received amount
    delete-dialog.tsx         "are you sure?" confirmation
    skeletons.tsx             grey placeholders while loading
    ui/                       shadcn components

  lib/                        Logic with no UI
    prisma.ts                 database connection
    auth.ts                   sessions, password check, route guard
    data.ts                   all read queries
    validations.ts            Zod schemas
    constants.ts              expense categories
    utils.ts                  currency and date formatting

  middleware.ts               Runs before every request; guards /admin

prisma/
  schema.prisma               Table definitions
  migrations/                 Version-controlled schema changes
```

**The rule that keeps this clean:** reads live in `lib/data.ts`, writes live in
`app/actions/`. Nothing else touches the database. When a number looks wrong,
there are only two places to look.

---

## 4. The database

### The tables

```prisma
model Trip {
  id          String    @id @default(cuid())
  name        String    @unique
  description String    @default("")
  received    Float     @default(0)     // the editable pot of money
  startDate   DateTime?                 // ? = optional
  endDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  expenses    Expense[]                 // one trip has many expenses
}

model Expense {
  id          String   @id @default(cuid())
  title       String
  description String   @default("")
  category    String                    // Food, Travel, Stay, Event, Misc
  amount      Float
  date        DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tripId      String                    // which trip this belongs to
  trip        Trip     @relation(fields: [tripId], references: [id],
                                 onDelete: Cascade)
}
```

Reading the important bits:

- **`@id @default(cuid())`** — every row gets a unique random ID automatically.
  Not `1, 2, 3`: sequential IDs leak how many records you have and let people
  guess URLs.
- **`@unique` on name** — two trips cannot share a name. The database enforces
  this, so it holds even if the app has a bug.
- **`tripId` is required** — an expense always belongs to a trip. There is no
  such thing as a floating expense.
- **`onDelete: Cascade`** — delete a trip and its expenses go too. They describe
  spending *on that trip*; without it they mean nothing.

### Migrations

A migration is a recorded schema change. `prisma/migrations/` holds them as
plain SQL:

```sql
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "received" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ...
);
```

They are committed to git, so any database — yours, a teammate's, production —
can be brought to the same shape by replaying them in order. This is why the
production database needed `prisma migrate deploy`: Neon handed us an empty
database, and the migration is what created the tables.

| Command | Use |
|---|---|
| `npm run db:migrate` | Development: change schema, create a migration |
| `npm run db:deploy` | Production: apply existing migrations, create nothing |

### Caching

Every page hitting the database on every request is slow. Reads are cached under
a tag:

```ts
export const getTripsWithTotals = cached(getTripsWithTotalsUncached, ["trips"]);
```

and every write clears it:

```ts
revalidateTag(LEDGER_TAG);
```

So repeated page loads are served from memory (~90ms), but the moment you save a
trip the cache is dropped and the next read is fresh. You never see a stale
number.

---

## 5. Prisma in depth

Prisma sits between your TypeScript and PostgreSQL. It is worth understanding
properly, because almost every bug in this project touched it.

### What an ORM actually does

Without one, you write SQL as strings:

```ts
const result = await db.query(
  'SELECT * FROM "Trip" WHERE id = $1', [tripId]
);
// result.rows[0].recieved  ← typo. undefined at runtime. no warning.
```

Nothing checks that the table exists, that the column is spelled right, or what
type comes back. With Prisma:

```ts
const trip = await prisma.trip.findUnique({ where: { id: tripId } });
// trip.recieved  ← red squiggle in your editor, build fails
```

The generated client knows your schema, so mistakes surface before the code
runs.

### The three files that matter

**1. `prisma/schema.prisma` — the single source of truth**

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"   // where the generated code lands
}

datasource db {
  provider = "postgresql"                // which database engine
}

model Trip { ... }
model Expense { ... }
```

This one file defines your tables *and* your TypeScript types. Change it, and
both follow.

**2. `src/generated/prisma/` — the generated client**

Created by `prisma generate`. This is real TypeScript, written by Prisma,
containing a `findMany` that knows about `Trip`, a `create` that knows `received`
is a number, and so on.

**It is not committed to git** — it is derived from the schema, so it is
regenerated during `npm run build`. This is exactly why `build` is defined as:

```json
"build": "prisma generate && next build"
```

Skip the generate step and the build fails with "Cannot find module
'@/generated/prisma/client'".

**3. `prisma/migrations/` — the history**

Every schema change, as timestamped SQL. Committed to git.

### The four commands, and when each applies

| Command | What it does | When |
|---|---|---|
| `prisma generate` | Rebuilds the client from the schema | After changing the schema; automatically during build |
| `prisma migrate dev` | Creates a migration file **and** applies it | Development only |
| `prisma migrate deploy` | Applies existing migrations, creates none | Production |
| `prisma studio` | Opens a browser GUI of your data | Any time you want to look |

The `dev` / `deploy` split matters. `migrate dev` can prompt you, and will offer
to reset the database if things do not line up — catastrophic in production.
`migrate deploy` only ever applies migrations that already exist, and never
prompts.

### Driver adapters — new in Prisma 7

Older Prisma bundled its own database driver. Version 7 requires you to pass one
explicitly:

```ts
import { PrismaPg } from "@prisma/adapter-pg";

new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});
```

This is why moving from SQLite to PostgreSQL was a real change, not just a
connection string:

| | SQLite (before) | PostgreSQL (now) |
|---|---|---|
| `schema.prisma` | `provider = "sqlite"` | `provider = "postgresql"` |
| Adapter package | `@prisma/adapter-better-sqlite3` | `@prisma/adapter-pg` |
| Connection | `file:./dev.db` | `postgresql://user:pass@host/db` |

Everything above the adapter — every query in `lib/data.ts`, every server action
— stayed identical. That is the payoff of an ORM.

### The connection singleton

`src/lib/prisma.ts` is small but does two subtle things.

**Problem one: hot reload.** In development, Next.js reloads modules on every
file save. A naive `new PrismaClient()` would open a fresh connection pool each
time, and after twenty saves you have exhausted the database's connection limit.

The fix is to cache the client on `globalThis`, which survives reloads:

```ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
```

**Problem two: build-time connections.** `next build` imports every route file to
collect page data. If the client is constructed at module scope, importing a
page opens a database connection — during the build, when `DATABASE_URL` may not
exist yet. That is exactly how the first Vercel deploy failed.

The fix is a `Proxy` that defers construction until the first real query:

```ts
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = globalForPrisma.prisma ?? createPrismaClient();
    return Reflect.get(client, property, receiver);
  },
});
```

`prisma.trip` triggers the `get` trap, which builds the client on first use.
Importing the module does nothing at all. Builds now succeed without a database,
and a genuinely missing `DATABASE_URL` produces a clear runtime error instead of
a cryptic build failure.

### Queries used in this project

**Aggregate — sums computed in the database, not in JavaScript:**

```ts
const tripAgg = await prisma.trip.aggregate({
  _sum: { received: true },
  _count: true,
});
```

The database returns one number. Fetching every row and summing in JS would
transfer more data as the ledger grows.

**Group by — spend per trip in a single query:**

```ts
const grouped = await prisma.expense.groupBy({
  by: ["tripId"],
  _sum: { amount: true },
  _count: true,
});
```

**Include — a trip and its expenses together:**

```ts
const trips = await prisma.trip.findMany({
  include: { expenses: { orderBy: [{ date: "desc" }] } },
});
```

This is what makes the public `/trips` page one query instead of one per trip.
With 50 trips that is the difference between 1 query and 51 — the classic
"N+1 problem", avoided.

### Error codes worth recognising

| Code | Meaning | We hit it when |
|---|---|---|
| `P2002` | Unique constraint failed | Creating a trip with a duplicate name |
| `P2021` | Table does not exist | Neon was empty; migrations had not run |
| `P2025` | Record not found | Editing something already deleted |
| `28P01` | Password authentication failed | After the Neon password was rotated |

`P2002` is handled explicitly in `app/actions/trip.ts` so the user sees "A trip
with that name already exists" rather than a stack trace.

---

## 6. Docker

### The problem it solves

To develop locally you need PostgreSQL running. Installing it normally means:
one version system-wide, config scattered across your OS, conflicts with other
projects, and no clean way to remove it.

Docker runs it in a **container** — an isolated box with its own filesystem and
network. Delete the box, and nothing is left behind.

### The command we ran

```bash
docker run -d --name balaji-postgres \
  -e POSTGRES_USER=balaji \
  -e POSTGRES_PASSWORD=balaji_dev_2026 \
  -e POSTGRES_DB=balaji_tracker \
  -p 5435:5432 \
  -v balaji_pgdata:/var/lib/postgresql/data \
  --restart unless-stopped \
  postgres:16
```

Line by line:

| Part | Meaning |
|---|---|
| `docker run` | Create and start a container |
| `-d` | Detached — runs in the background |
| `--name balaji-postgres` | A handle, so you can say `docker stop balaji-postgres` |
| `-e POSTGRES_USER=...` | Environment variables the image reads on **first** start to create the user, password, and database |
| `-p 5435:5432` | Port mapping — your machine's 5435 → container's 5432 |
| `-v balaji_pgdata:...` | Volume — where data actually lives (see below) |
| `--restart unless-stopped` | Comes back after a reboot |
| `postgres:16` | The image, pinned to major version 16 |

### Why port 5435

Before running it, we checked what was already listening:

```
127.0.0.1:5432   ← a PostgreSQL already installed on your machine
5433             ← billing-service-oltp (another project)
5434             ← billing-service-olap
```

5432 was taken, so using it would have collided. 5435 was the first free port.

### The volume — why data survives

A container's own filesystem disappears when the container is deleted. The `-v`
flag mounts a **named volume** at the path PostgreSQL writes to, so the data
lives outside the container:

```
docker rm balaji-postgres              → container gone, data safe
docker run ... -v balaji_pgdata:...    → same data back
```

Without that flag, every restart would wipe your trips. This is the single most
important part of the command.

### Useful commands

```bash
docker ps                                   # what is running
docker logs balaji-postgres                 # its output
docker stop balaji-postgres                 # pause
docker start balaji-postgres                # resume
docker exec -it balaji-postgres psql -U balaji -d balaji_tracker   # SQL prompt
```

### Docker is local only

**Vercel never sees Docker.** It exists so you have a real PostgreSQL on your
machine while developing. Production uses Neon.

---

## 7. Neon

### Why a hosted database is required

Your Docker PostgreSQL listens on `localhost:5435` — meaning *this machine*.
Vercel's servers are in Virginia. They cannot reach your laptop.

Vercel also cannot host a database itself: it runs **serverless functions**,
which start, handle one request, and shut down. There is nowhere persistent to
put data.

So production needs a database that lives on the internet. That is Neon.

### Why Neon specifically

- Real PostgreSQL — the same code works, no changes
- Free tier is plenty for this app
- Built for serverless: connections open and close per request, matching how
  Next.js behaves
- Installs as a Vercel integration and sets `DATABASE_URL` automatically

Alternatives considered: **Supabase** works but bundles auth/storage/realtime we
do not need. **Prisma Postgres** despite the matching name requires a different
adapter and connection format — code changes for no benefit.

### What we did

1. Vercel → Storage → Neon → Free plan → region `us-east-1` (same as the build)
2. Connected it to the project, which injected `DATABASE_URL`
3. Created the tables from your machine:

```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require" \
  npx prisma migrate deploy
```

That last step is essential and easy to miss. Neon gives you an **empty**
database — no tables. Without the migration every page fails with
`P2021: table "public.Trip" does not exist`.

### Two separate databases

| | Where | Contains |
|---|---|---|
| Local | Docker, `localhost:5435` | Your test data |
| Production | Neon, AWS us-east-1 | Real data |

They never sync. You cannot break production by experimenting locally — a
property worth keeping.

### Free tier note

The database **suspends after ~5 minutes idle**. The next request wakes it,
taking a few seconds, then it is fast again. Not a bug.

---

## 8. Vercel

### What it does

Hosting built for Next.js. Push to GitHub, and it builds and deploys
automatically.

```
git push  →  GitHub  →  Vercel builds  →  live URL
```

### Serverless functions

Traditional hosting keeps a server running permanently. Vercel does not. Each
request wakes a function, which runs and then disappears.

Consequences worth understanding:

- **Nothing persists between requests** — hence the external database
- **You cannot write files** — nothing would read them later
- **Scaling is automatic** — 1,000 requests start 1,000 functions

### Environment variables

Secrets do not live in the code. They are set in Vercel's dashboard and injected
at runtime:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon connection string (set by the integration) |
| `ADMIN_USERNAME` | Admin login name |
| `ADMIN_PASSWORD` | Admin password |
| `AUTH_SECRET` | Key for signing session cookies, min 32 chars |

`.env` is in `.gitignore` and has never been committed. Anything in the repo is
public; anything in Vercel's settings is not.

**Environment variable changes require a redeploy.** They are baked in when the
deployment is created — editing them does not affect a running deployment.

### Deploying

1. Push to `main`
2. Vercel builds automatically
3. If env vars changed: Deployments → ⋯ → Redeploy

---

## 9. Authentication

### One account, no registration

There is exactly one admin, defined entirely by `ADMIN_USERNAME` and
`ADMIN_PASSWORD`. No user table, no signup page. For a single-admin app,
anything more is unnecessary attack surface.

### How login works

1. You submit the form
2. `loginAction` compares your input against the environment variables
3. On success, a **JWT** is signed with `AUTH_SECRET` and stored in a cookie
4. Every later request sends that cookie; the server verifies the signature

The cookie is:

- **`httpOnly`** — JavaScript cannot read it, so a script injection cannot steal it
- **`secure`** in production — only sent over HTTPS
- **`sameSite=lax`** — not sent from other sites, blocking cross-site request forgery
- **7-day expiry**

### Constant-time comparison

Passwords are compared with every byte checked, even after a mismatch:

```ts
let mismatch = aBytes.length ^ bBytes.length;
for (let i = 0; i < max; i++) {
  mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
}
return mismatch === 0;
```

A normal `===` returns as soon as it finds a difference. Measuring those timing
differences across many attempts can reveal the password one character at a
time. This version always takes the same time.

### Two layers of protection

**Middleware** redirects signed-out visitors away from `/admin`.

**Every server action independently calls `requireAdmin()`.** This is the layer
that actually matters. Middleware only affects page navigation — someone could
craft a direct request to a server action. `requireAdmin()` blocks it.

Hiding buttons is presentation. Authorisation happens on the server.

---

## 10. How a click becomes saved data

Clicking "Create trip":

```
1. Browser        Form submits
2. Client         Zod validates → instant feedback if wrong
3. Server Action  createTrip() runs on the server
4. Server         requireAdmin() — is there a valid session?
5. Server         Zod validates again — never trust the browser
6. Prisma         Builds SQL: INSERT INTO "Trip" ...
7. Neon           Writes to disk, confirms
8. Server         revalidateTag("ledger") — drop the cache
9. Browser        Page updates, toast appears
```

Reading a page:

```
1. Request arrives
2. Cached?  → serve immediately (~90ms)
3. Not cached? → Prisma SELECT → Neon → cache it → render
```

Validation happens twice on purpose. The client copy is for speed; the server
copy is the one that cannot be bypassed.

---

## 11. Problems we hit and what caused them

Recording these because the causes are non-obvious and likely to recur.

### `UnrecognizedActionError` / `ChunkLoadError`

**Symptom.** Login threw "Server Action … was not found on the server", or pages
failed to load chunks.

**Cause.** Two things:

1. `postinstall: "prisma generate"` ran on *every* `npm install`, wiping the
   build output while a server was running.
2. `next dev` silently falls back to port 3001 when 3000 is busy. An orphaned
   server from an earlier session kept serving an old build, and the browser
   held a page whose Server Action IDs no longer existed.

**Fix.** Moved generation into `build` (Vercel still runs it). Pinned the dev
server to port 3000 so a collision fails loudly. Added `npm run dev:clean`.

### Build failed on Vercel — `DATABASE_URL is not set`

**Cause.** The Prisma client was created at module import. `next build` imports
every route to collect page data, so importing a page tried to open a database
connection — before any environment variable existed.

**Fix.** A `Proxy` defers construction until the first actual query. Data pages
are marked `force-dynamic` so none is prerendered at build time. Verified by
building locally with `DATABASE_URL` unset.

### Runtime error — `table "public.Trip" does not exist`

**Cause.** Neon provides an empty database. Nothing creates the tables
automatically.

**Fix.** `prisma migrate deploy` against the production URL, once.

### A command that silently did nothing

```bash
DATABASE_URL=postgresql://...?channel_binding=require&sslmode=require npx prisma migrate deploy
```

**Cause.** The unquoted `&` is a shell operator meaning "run in background". Bash
split the line in two; the migration never ran.

**Fix.** Quote the URL:

```bash
DATABASE_URL="postgresql://...&sslmode=require" npx prisma migrate deploy
```

### SSH pushed to the wrong GitHub account

**Cause.** The key was correctly added to `swapnilranmale2003`, but `ssh-agent`
offered a different loaded key first. `-i` does not override an agent that
answers.

**Fix.** `-o IdentityAgent=none`, saved in this repo's git config only.

---

## 12. Everyday commands

### Development

```bash
npm run dev          # start on port 3000
npm run dev:clean    # free the port, clear .next, restart
npm run build        # production build
npm run lint         # check code style
npm run typecheck    # check types
```

### Database

```bash
npm run db:studio    # browse data in a GUI at localhost:5555
npm run db:migrate   # create a migration after changing schema.prisma
npm run db:deploy    # apply migrations (production)
npm run db:seed      # clear all data
```

### Docker

```bash
docker ps                     # is PostgreSQL running?
docker start balaji-postgres  # start it
docker stop balaji-postgres   # stop it
```

### Deploying

```bash
git add -A
git commit -m "what changed"
git push              # Vercel deploys automatically
```

### Changing the schema

```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply locally
npm run db:migrate

# 3. Commit — the migration file must be in git
git add -A && git commit -m "Add field X" && git push

# 4. Apply to production, once
DATABASE_URL="<neon-url>" npx prisma migrate deploy
```

Step 4 is easy to forget. Without it, production code expects a column the
production database does not have.

---

## 13. Still to do

### Rotate the Neon password

The database password was pasted into a chat during setup. It should be treated
as compromised:

1. Neon Console → Roles → `neondb_owner` → Reset password
2. Confirm Vercel's `DATABASE_URL` picked up the change
3. Redeploy

### Confirm the admin credentials

`ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `AUTH_SECRET` must all be set in Vercel.
If any is missing, login fails — correctly, but confusingly.

Do not reuse `Kunal@123`: it appears in this repository's git history, and the
repository is public.

### Consider making the repository private

Everything in it is world-readable. The code is fine to share; decide
deliberately whether the deployment details should be.

### Consider before real data goes in

- The public pages show every trip name, amount, and expense to anyone with the
  URL. That is the design — confirm it is what you want.
- There are no automated tests. Everything so far was verified by driving a real
  browser against a real database, which is thorough but not repeatable.
