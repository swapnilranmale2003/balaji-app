/**
 * Seed script — intentionally empty.
 *
 * The app ships with no sample data: the admin creates real trips and records
 * real expenses. Run `npm run db:seed` only if you want to clear the database.
 */
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Expenses cascade from trips, but delete explicitly so the intent is clear.
  await prisma.expense.deleteMany();
  await prisma.trip.deleteMany();

  console.log("Database cleared. No sample data is created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
