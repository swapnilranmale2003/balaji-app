import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
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
import { getTripsWithTotals } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Trips",
};


/** "12 Jul 2026 – 18 Jul 2026", or a single date, or an em dash. */
function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return "—";
}

export default async function PublicTripsPage() {
  const [session, trips] = await Promise.all([
    getSession(),
    getTripsWithTotals(),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar isAdmin={Boolean(session)} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Trips
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {trips.length > 0
              ? `${trips.length} ${trips.length === 1 ? "trip" : "trips"} recorded`
              : "Expenses grouped by trip."}
          </p>
        </div>

        <Card className="gap-0 py-0">
          <CardContent className="p-0">
            {trips.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="font-medium">No trips yet</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Trips will appear here once the admin creates one.
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
                          {trip.description && (
                            <p className="text-muted-foreground line-clamp-1 text-xs">
                              {trip.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                          {formatRange(trip.startDate, trip.endDate)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                          {formatCurrency(trip.received)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums whitespace-nowrap">
                          {formatCurrency(trip.totalSpent)}
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            ({trip.expenseCount})
                          </span>
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
