import { Suspense } from "react";

import {
  DashboardCards,
  DashboardCardsSkeleton,
} from "@/components/dashboard-cards";
import { ExpenseTable } from "@/components/expense-table";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import {
  CategoryBreakdownChart,
  MonthlySummaryChart,
} from "@/components/summary-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";
import {
  getCategoryBreakdown,
  getExpenses,
  getMonthlySummary,
  getSummary,
} from "@/lib/data";

// Totals must reflect the latest ledger, so this page is always rendered fresh.
export const dynamic = "force-dynamic";

async function SummarySection() {
  const summary = await getSummary();
  return <DashboardCards summary={summary} />;
}

async function ChartsSection() {
  const [monthly, categories] = await Promise.all([
    getMonthlySummary(),
    getCategoryBreakdown(),
  ]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <MonthlySummaryChart data={monthly} />
      <CategoryBreakdownChart data={categories} />
    </div>
  );
}

async function ExpensesSection() {
  const expenses = await getExpenses();
  return <ExpenseTable expenses={expenses} />;
}

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar isAdmin={Boolean(session)} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Team Fund Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            An open record of everything the team has collected and spent.
          </p>
        </div>

        {/* Each section streams in independently, so a slow query never blocks
            the rest of the page. */}
        <Suspense fallback={<DashboardCardsSkeleton />}>
          <SummarySection />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[420px] w-full rounded-xl" />}>
          <ChartsSection />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
          <ExpensesSection />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
