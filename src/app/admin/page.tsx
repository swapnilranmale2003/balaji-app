import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { StatRow } from "@/components/stat-row";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSummary, getTripsWithTotals } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

/** "12 Jul 2026 – 18 Jul 2026", or a single date, or an em dash. */
function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return "—";
}

export default async function AdminDashboardPage() {
  const [summary, trips] = await Promise.all([
    getSummary(),
    getTripsWithTotals(),
  ]);

  const recent = trips.slice(0, 5);

  return (
    <>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Funds and spending across every trip.
          </p>
        </div>
        <Link
          href="/admin/trips"
          className={cn(buttonVariants({ size: "sm" }), "self-start sm:self-auto")}
        >
          <Plus className="size-4" />
          New Trip
        </Link>
      </div>

      <StatRow
        stats={[
          {
            label: "Total Received",
            value: summary.totalReceived,
            hint: `Across ${summary.tripCount} ${summary.tripCount === 1 ? "trip" : "trips"}`,
          },
          {
            label: "Total Spent",
            value: summary.totalExpenses,
            hint: `${summary.expenseCount} ${summary.expenseCount === 1 ? "expense" : "expenses"}`,
          },
          {
            label: "Remaining Balance",
            value: summary.remainingBalance,
            hint:
              summary.remainingBalance < 0
                ? "Spending exceeds funds"
                : "Available to spend",
            emphasise: true,
          },
          { label: "Trips", value: String(summary.tripCount) },
        ]}
      />

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-sm font-medium">Recent Trips</h2>
            {trips.length > 0 && (
              <Link
                href="/admin/trips"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
              >
                View all
                <ArrowRight className="size-3.5" />
              </Link>
            )}
          </div>

          {trips.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="font-medium">No trips yet</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                Create a trip, set how much was collected for it, then record
                expenses against it.
              </p>
              <Link
                href="/admin/trips"
                className={cn(buttonVariants({ size: "sm" }), "mt-1")}
              >
                <Plus className="size-4" />
                New Trip
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[12rem]">Trip</TableHead>
                    <TableHead className="min-w-[11rem]">Dates</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recent.map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <Link
                          href={`/admin/trips/${trip.id}`}
                          className="font-medium hover:underline"
                        >
                          {trip.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {formatRange(trip.startDate, trip.endDate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {formatCurrency(trip.received)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {formatCurrency(trip.totalSpent)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums whitespace-nowrap",
                          trip.balance < 0 && "text-destructive",
                        )}
                      >
                        {formatCurrency(trip.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
