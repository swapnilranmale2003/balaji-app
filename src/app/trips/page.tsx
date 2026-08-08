import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { Badge } from "@/components/ui/badge";
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
import { getCategoryMeta } from "@/lib/constants";
import { getTripsWithExpenses } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

// Reads the ledger per request; never prerendered at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trips",
};

/** "12 Jul 2026 – 18 Jul 2026", or a single date, or nothing. */
function formatRange(start: Date | null, end: Date | null): string | null {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return null;
}

export default async function PublicTripsPage() {
  const [session, trips] = await Promise.all([
    getSession(),
    getTripsWithExpenses(),
  ]);

  const totals = trips.reduce(
    (acc, trip) => ({
      received: acc.received + trip.received,
      spent: acc.spent + trip.totalSpent,
      expenses: acc.expenses + trip.expenseCount,
    }),
    { received: 0, spent: 0, expenses: 0 },
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar isAdmin={Boolean(session)} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Trips &amp; Expenses
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {trips.length > 0
              ? `${trips.length} ${trips.length === 1 ? "trip" : "trips"} · ${totals.expenses} ${totals.expenses === 1 ? "expense" : "expenses"} · ${formatCurrency(totals.spent)} spent of ${formatCurrency(totals.received)}`
              : "Every expense, grouped by trip."}
          </p>
        </div>

        {trips.length === 0 ? (
          <Card className="gap-0 py-0">
            <CardContent className="px-6 py-16 text-center">
              <p className="font-medium">No trips yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Trips will appear here once the admin creates one.
              </p>
            </CardContent>
          </Card>
        ) : (
          trips.map((trip) => {
            const range = formatRange(trip.startDate, trip.endDate);

            return (
              <Card key={trip.id} className="gap-0 py-0">
                <CardContent className="p-0">
                  <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="font-medium hover:underline"
                      >
                        {trip.name}
                      </Link>
                      <p className="text-muted-foreground text-xs">
                        {trip.description || "No description"}
                        {range && <> · {range}</>}
                      </p>
                    </div>

                    <dl className="flex shrink-0 items-center gap-4 text-sm sm:gap-6">
                      <div>
                        <dt className="text-muted-foreground text-xs">Received</dt>
                        <dd className="font-medium tabular-nums">
                          {formatCurrency(trip.received)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Spent</dt>
                        <dd className="font-medium tabular-nums">
                          {formatCurrency(trip.totalSpent)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground text-xs">Balance</dt>
                        <dd
                          className={cn(
                            "font-medium tabular-nums",
                            trip.balance < 0 && "text-destructive",
                          )}
                        >
                          {formatCurrency(trip.balance)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {trip.expenses.length === 0 ? (
                    <p className="text-muted-foreground px-4 py-8 text-center text-sm">
                      No expenses recorded for this trip yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="min-w-[7rem]">Date</TableHead>
                            <TableHead className="min-w-[10rem]">
                              Expense
                            </TableHead>
                            <TableHead className="min-w-[8rem]">
                              Category
                            </TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trip.expenses.map((expense) => {
                            const meta = getCategoryMeta(expense.category);
                            const Icon = meta.icon;

                            return (
                              <TableRow key={expense.id}>
                                <TableCell className="text-muted-foreground text-sm whitespace-nowrap tabular-nums">
                                  {formatDate(expense.date)}
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium">
                                    {expense.title}
                                  </span>
                                  {expense.description && (
                                    <p className="text-muted-foreground line-clamp-1 text-xs">
                                      {expense.description}
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "gap-1 font-normal",
                                      meta.className,
                                    )}
                                  >
                                    <Icon className="size-3" />
                                    {expense.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium tabular-nums whitespace-nowrap">
                                  {formatCurrency(expense.amount)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="text-muted-foreground flex items-center justify-between border-t px-4 py-2.5 text-sm">
                    <span>
                      {trip.expenseCount}{" "}
                      {trip.expenseCount === 1 ? "expense" : "expenses"}
                    </span>
                    <Link
                      href={`/trips/${trip.id}`}
                      className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
                    >
                      Open trip
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>

      <Footer />
    </div>
  );
}
