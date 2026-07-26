import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

/** Builds a UTC-midnight date, matching how the app stores dates. */
function utc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

const incomes = [
  { amount: 10000, description: "Team Collection", date: utc(2026, 7, 26) },
  { amount: 5000, description: "Sponsorship from Acme Corp", date: utc(2026, 7, 12) },
  { amount: 7500, description: "June team collection", date: utc(2026, 6, 5) },
  { amount: 3000, description: "Leftover from last quarter", date: utc(2026, 5, 18) },
];

const expenses = [
  {
    title: "Lunch",
    description: "Team lunch after the sprint review",
    category: "Food",
    amount: 2000,
    date: utc(2026, 7, 26),
  },
  {
    title: "Cab to venue",
    description: "Round trip for six people",
    category: "Travel",
    amount: 1450,
    date: utc(2026, 7, 20),
  },
  {
    title: "Offsite hotel",
    description: "Two nights, three rooms",
    category: "Stay",
    amount: 6800,
    date: utc(2026, 7, 8),
  },
  {
    title: "Annual day decorations",
    description: "Banners, lights and stage setup",
    category: "Event",
    amount: 3200,
    date: utc(2026, 6, 22),
  },
  {
    title: "Stationery",
    description: "Markers, sticky notes and notepads",
    category: "Miscellaneous",
    amount: 620,
    date: utc(2026, 6, 14),
  },
  {
    title: "Snacks and coffee",
    description: "Refreshments for the hackathon",
    category: "Food",
    amount: 1150,
    date: utc(2026, 5, 30),
  },
];

async function main() {
  // Start from a clean slate so re-seeding does not duplicate rows.
  await prisma.expense.deleteMany();
  await prisma.income.deleteMany();

  await prisma.income.createMany({ data: incomes });
  await prisma.expense.createMany({ data: expenses });

  const totalReceived = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);

  console.log(`Seeded ${incomes.length} income and ${expenses.length} expense records.`);
  console.log(`Total received: ₹${totalReceived}`);
  console.log(`Total spent:    ₹${totalSpent}`);
  console.log(`Balance:        ₹${totalReceived - totalSpent}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
