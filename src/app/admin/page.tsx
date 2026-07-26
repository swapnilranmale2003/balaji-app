import type { Metadata } from "next";
import { Suspense } from "react";

import { QuickActions } from "@/app/admin/quick-actions";
import {
  DashboardCards,
  DashboardCardsSkeleton,
} from "@/components/dashboard-cards";
import { RecentTransactions } from "@/components/recent-transactions";
import {
  CategoryBreakdownChart,
  MonthlySummaryChart,
} from "@/components/summary-charts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getCategoryBreakdown,
  getMonthlySummary,
  getRecentTransactions,
  getSummary,
  getTripOptions,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Dashboard",
};

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

async function TransactionsSection() {
  const transactions = await getRecentTransactions();
  return <RecentTransactions transactions={transactions} />;
}

export default async function AdminDashboardPage() {
  const trips = await getTripOptions();

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the team fund — record what comes in and what goes out.
          </p>
        </div>
        <QuickActions trips={trips} />
      </div>

      <Suspense fallback={<DashboardCardsSkeleton />}>
        <SummarySection />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[420px] w-full rounded-xl" />}>
        <ChartsSection />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
        <TransactionsSection />
      </Suspense>
    </>
  );
}
