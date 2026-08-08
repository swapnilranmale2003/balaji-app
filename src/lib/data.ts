import "server-only";

import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";

/** Every read is cached under this tag and invalidated on any write. */
export const LEDGER_TAG = "ledger";

function cached<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  keyParts: string[],
) {
  return unstable_cache(fn, keyParts, { tags: [LEDGER_TAG] });
}

export type ExpenseRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  amount: number;
  date: Date;
  createdAt: Date;
  tripId: string;
  /** Denormalised for display so tables need no extra lookup. */
  tripName?: string;
};

export type TripRecord = {
  id: string;
  name: string;
  description: string;
  received: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
};

export type TripWithTotals = TripRecord & {
  totalSpent: number;
  /** Derived, never stored: received - totalSpent. */
  balance: number;
  expenseCount: number;
};

export type Summary = {
  totalReceived: number;
  totalExpenses: number;
  /** Derived, never stored: totalReceived - totalExpenses. */
  remainingBalance: number;
  tripCount: number;
  expenseCount: number;
};

/**
 * Portfolio-wide totals, aggregated in the database rather than summed in JS
 * so the work stays O(1) in transferred rows as the ledger grows.
 */
async function getSummaryUncached(): Promise<Summary> {
  const [tripAgg, expenseAgg] = await Promise.all([
    prisma.trip.aggregate({ _sum: { received: true }, _count: true }),
    prisma.expense.aggregate({ _sum: { amount: true }, _count: true }),
  ]);

  const totalReceived = tripAgg._sum.received ?? 0;
  const totalExpenses = expenseAgg._sum.amount ?? 0;

  return {
    totalReceived,
    totalExpenses,
    remainingBalance: totalReceived - totalExpenses,
    tripCount: tripAgg._count,
    expenseCount: expenseAgg._count,
  };
}

/** Trips with their spend totals and balances, most recent first. */
async function getTripsWithTotalsUncached(): Promise<TripWithTotals[]> {
  const [trips, grouped] = await Promise.all([
    prisma.trip.findMany({
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    }),
    prisma.expense.groupBy({
      by: ["tripId"],
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totals = new Map(
    grouped.map((row) => [
      row.tripId,
      { sum: row._sum.amount ?? 0, count: row._count },
    ]),
  );

  return trips.map((trip) => {
    const totalSpent = totals.get(trip.id)?.sum ?? 0;

    return {
      ...trip,
      totalSpent,
      balance: trip.received - totalSpent,
      expenseCount: totals.get(trip.id)?.count ?? 0,
    };
  });
}

export type TripWithExpenses = TripWithTotals & {
  expenses: ExpenseRecord[];
};

/**
 * Every trip with its expenses attached, for the public trip-wise breakdown.
 * One query per table rather than one per trip, so the cost does not grow with
 * the number of trips.
 */
async function getTripsWithExpensesUncached(): Promise<TripWithExpenses[]> {
  const trips = await prisma.trip.findMany({
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: {
      expenses: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
    },
  });

  return trips.map(({ expenses, ...trip }) => {
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);

    return {
      ...trip,
      totalSpent,
      balance: trip.received - totalSpent,
      expenseCount: expenses.length,
      expenses: expenses.map((expense) => ({
        ...expense,
        tripName: trip.name,
      })),
    };
  });
}

/** A single trip plus its expenses, or null when the trip does not exist. */
async function getTripWithExpensesUncached(
  id: string,
): Promise<{ trip: TripWithTotals; expenses: ExpenseRecord[] } | null> {
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      expenses: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] },
    },
  });

  if (!trip) return null;

  const { expenses, ...rest } = trip;
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    trip: {
      ...rest,
      totalSpent,
      balance: trip.received - totalSpent,
      expenseCount: expenses.length,
    },
    expenses: expenses.map((expense) => ({ ...expense, tripName: trip.name })),
  };
}

export async function getTripById(id: string): Promise<TripRecord | null> {
  return prisma.trip.findUnique({ where: { id } });
}

export const getSummary = cached(getSummaryUncached, ["summary"]);
export const getTripsWithTotals = cached(getTripsWithTotalsUncached, ["trips"]);
export const getTripsWithExpenses = cached(getTripsWithExpensesUncached, [
  "trips-expenses",
]);
export const getTripWithExpenses = cached(getTripWithExpensesUncached, ["trip"]);
