import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { StatRow } from "@/components/stat-row";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSession } from "@/lib/auth";
import { getSummary, getTripsWithTotals } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

/** "12 Jul 2026 – 18 Jul 2026", or a single date, or an em dash. */
function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return "—";
}

export default async function HomePage() {
  const [session, summary, trips] = await Promise.all([
    getSession(),
    getSummary(),
    getTripsWithTotals(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar isAdmin={Boolean(session)} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Team Fund Overview
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            An open record of what the team collected and spent.
          </p>
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
              emphasise: true,
            },
            { label: "Trips", value: String(summary.tripCount) },
          ]}
        />

        <Card className="gap-0 py-0">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-medium">Trips</h2>
              {trips.length > 0 && (
                <Link
                  href="/trips"
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
                >
                  View all expenses
                  <ArrowRight className="size-3.5" />
                </Link>
              )}
            </div>

            {trips.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="font-medium">Nothing recorded yet</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Trips will appear here once the admin adds one.
                </p>
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
                    {trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <Link
                            href={`/trips/${trip.id}`}
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
      </main>

      <Footer />
    </div>
  );
}
