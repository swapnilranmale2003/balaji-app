import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange, MapPin, Receipt } from "lucide-react";

import { ExpenseTable } from "@/components/expense-table";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { getTripWithExpenses } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getTripWithExpenses(id);

  return { title: result ? result.trip.name : "Trip not found" };
}

/** "12 Jul 2026 – 18 Jul 2026", or a single date, or nothing. */
function formatRange(start: Date | null, end: Date | null): string | null {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return null;
}

export default async function TripDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [session, result] = await Promise.all([
    getSession(),
    getTripWithExpenses(id),
  ]);

  if (!result) notFound();

  const { trip, expenses } = result;
  const range = formatRange(trip.startDate, trip.endDate);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar isAdmin={Boolean(session)} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/trips"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          All trips
        </Link>

        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
            <MapPin className="text-muted-foreground size-6 shrink-0" />
            {trip.name}
          </h1>
          {trip.description && (
            <p className="text-muted-foreground mt-1">{trip.description}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="gap-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Total Spent
              </CardTitle>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                <Receipt className="size-5" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight tabular-nums lg:text-3xl">
                {formatCurrency(trip.totalSpent)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Across {trip.expenseCount}{" "}
                {trip.expenseCount === 1 ? "expense" : "expenses"}
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Expenses
              </CardTitle>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400">
                <Receipt className="size-5" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tracking-tight tabular-nums lg:text-3xl">
                {trip.expenseCount}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Recorded for this trip
              </p>
            </CardContent>
          </Card>

          <Card className="gap-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                Dates
              </CardTitle>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400">
                <CalendarRange className="size-5" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold tracking-tight">
                {range ?? "Not set"}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">Trip schedule</p>
            </CardContent>
          </Card>
        </div>

        {/* The trip column is redundant here — every row is this trip. */}
        <ExpenseTable
          expenses={expenses}
          showTripColumn={false}
          title={`Expenses for ${trip.name}`}
        />
      </main>

      <Footer />
    </div>
  );
}
