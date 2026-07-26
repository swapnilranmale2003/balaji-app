import type { Metadata } from "next";
import Link from "next/link";
import { CalendarRange, MapPin, Receipt } from "lucide-react";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { getTripsWithTotals } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Trips",
};

export const dynamic = "force-dynamic";

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
    getTripsWithTotals(),
  ]);

  const grandTotal = trips.reduce((sum, trip) => sum + trip.totalSpent, 0);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar isAdmin={Boolean(session)} />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trips</h1>
          <p className="text-muted-foreground mt-1">
            {trips.length > 0
              ? `${trips.length} ${trips.length === 1 ? "trip" : "trips"} · ${formatCurrency(grandTotal)} spent in total`
              : "Expenses grouped by trip."}
          </p>
        </div>

        {trips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-xl">
                <MapPin className="size-6" />
              </span>
              <div>
                <p className="font-medium">No trips yet</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Trips will appear here once the admin creates one.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => {
              const range = formatRange(trip.startDate, trip.endDate);

              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
                >
                <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="text-muted-foreground size-4 shrink-0" />
                      <span className="truncate">{trip.name}</span>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {trip.description || "No description"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="mt-auto grid gap-3">
                    {range && (
                      <p className="text-muted-foreground flex items-center gap-2 text-sm">
                        <CalendarRange className="size-4 shrink-0" />
                        {range}
                      </p>
                    )}

                    <div className="flex items-end justify-between gap-2 border-t pt-3">
                      <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <Receipt className="size-4" />
                        {trip.expenseCount}{" "}
                        {trip.expenseCount === 1 ? "expense" : "expenses"}
                      </span>
                      <span className="text-lg font-bold tabular-nums">
                        {formatCurrency(trip.totalSpent)}
                      </span>
                    </div>

                    <span className="text-primary text-sm font-medium">
                      View expenses →
                    </span>
                  </CardContent>
                </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
