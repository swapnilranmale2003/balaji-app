import "server-only";

import { prisma } from "@/lib/prisma";
import { formatMonthLabel, monthKey } from "@/lib/utils";

export type IncomeRecord = {
  id: string;
  amount: number;
  description: string;
  date: Date;
  createdAt: Date;
};

export type ExpenseRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  date: Date;
  createdAt: Date;
};

export type Summary = {
  totalReceived: number;
  totalExpenses: number;
  /** Derived, never stored: totalReceived - totalExpenses. */
  remainingBalance: number;
  totalTransactions: number;
  incomeCount: number;
  expenseCount: number;
};

/**
 * Aggregates totals in the database rather than summing in JS, so the work
 * stays O(1) in transferred rows as the ledger grows.
 */
export async function getSummary(): Promise<Summary> {
  const [incomeAgg, expenseAgg] = await Promise.all([
    prisma.income.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.expense.aggregate({ _sum: { amount: true }, _count: true }),
  ]);

  const totalReceived = incomeAgg._sum.amount ?? 0;
  const totalExpenses = expenseAgg._sum.amount ?? 0;

  return {
    totalReceived,
    totalExpenses,
    remainingBalance: totalReceived - totalExpenses,
    totalTransactions: incomeAgg._count + expenseAgg._count,
    incomeCount: incomeAgg._count,
    expenseCount: expenseAgg._count,
  };
}

export async function getExpenses(): Promise<ExpenseRecord[]> {
  return prisma.expense.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
}

export async function getIncomes(): Promise<IncomeRecord[]> {
  return prisma.income.findMany({ orderBy: [{ date: "desc" }, { createdAt: "desc" }] });
}

export type Transaction = {
  id: string;
  type: "income" | "expense";
  title: string;
  description: string;
  category: string | null;
  amount: number;
  date: Date;
};

/** Merges income and expenses into one reverse-chronological feed. */
export async function getRecentTransactions(limit = 8): Promise<Transaction[]> {
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
    prisma.expense.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: limit,
    }),
  ]);

  const merged: Transaction[] = [
    ...incomes.map((income) => ({
      id: income.id,
      type: "income" as const,
      title: "Received",
      description: income.description,
      category: null,
      amount: income.amount,
      date: income.date,
    })),
    ...expenses.map((expense) => ({
      id: expense.id,
      type: "expense" as const,
      title: expense.title,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
    })),
  ];

  return merged
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}

export type MonthlyPoint = {
  key: string;
  month: string;
  received: number;
  spent: number;
};

/**
 * Received vs spent per month, oldest first, for the dashboard chart.
 * Months with no activity are omitted rather than back-filled with zeros.
 */
export async function getMonthlySummary(
  monthsToShow = 6,
): Promise<MonthlyPoint[]> {
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({ select: { amount: true, date: true } }),
    prisma.expense.findMany({ select: { amount: true, date: true } }),
  ]);

  const buckets = new Map<string, MonthlyPoint>();

  const bucketFor = (date: Date): MonthlyPoint => {
    const key = monthKey(date);
    let bucket = buckets.get(key);

    if (!bucket) {
      bucket = { key, month: formatMonthLabel(date), received: 0, spent: 0 };
      buckets.set(key, bucket);
    }

    return bucket;
  };

  for (const income of incomes) bucketFor(income.date).received += income.amount;
  for (const expense of expenses) bucketFor(expense.date).spent += expense.amount;

  return [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-monthsToShow);
}

export type CategoryPoint = {
  category: string;
  total: number;
};

/** Expense totals per category, largest first, for the breakdown chart. */
export async function getCategoryBreakdown(): Promise<CategoryPoint[]> {
  const grouped = await prisma.expense.groupBy({
    by: ["category"],
    _sum: { amount: true },
  });

  return grouped
    .map((row) => ({ category: row.category, total: row._sum.amount ?? 0 }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}

export async function getExpenseById(id: string): Promise<ExpenseRecord | null> {
  return prisma.expense.findUnique({ where: { id } });
}

export async function getIncomeById(id: string): Promise<IncomeRecord | null> {
  return prisma.income.findUnique({ where: { id } });
}
