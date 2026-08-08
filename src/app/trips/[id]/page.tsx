import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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
import { getTripWithExpenses } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

// Reads the ledger per request; never prerendered at build time.
export const dynamic = "force-dynamic";


type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
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

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/trips"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Trips
        </Link>

        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {trip.name}
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {trip.description || "No description"}
            {range && <> · {range}</>}
          </p>
        </div>

        <dl className="bg-card grid divide-y rounded-lg border sm:grid-cols-3 sm:divide-y-0">
          <div className="px-5 py-4 sm:border-r">
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Total Received
            </dt>
            <dd className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(trip.received)}
            </dd>
          </div>
          <div className="px-5 py-4 sm:border-r">
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Total Spent
            </dt>
            <dd className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
              {formatCurrency(trip.totalSpent)}
            </dd>
            <p className="text-muted-foreground mt-1 text-xs">
              {trip.expenseCount}{" "}
              {trip.expenseCount === 1 ? "expense" : "expenses"}
            </p>
          </div>
          <div className="px-5 py-4">
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Balance
            </dt>
            <dd
              className={cn(
                "mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
                trip.balance < 0 && "text-destructive",
              )}
            >
              {formatCurrency(trip.balance)}
            </dd>
          </div>
        </dl>

        <Card className="gap-0 py-0">
          <CardContent className="p-0">
            <div className="border-b px-4 py-3">
              <h2 className="text-sm font-medium">Expenses</h2>
            </div>

            {expenses.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="font-medium">No expenses yet</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Nothing has been spent on this trip so far.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[7rem]">Date</TableHead>
                      <TableHead className="min-w-[10rem]">Expense</TableHead>
                      <TableHead className="min-w-[8rem]">Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => {
                      const meta = getCategoryMeta(expense.category);
                      const Icon = meta.icon;

                      return (
                        <TableRow key={expense.id}>
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap tabular-nums">
                            {formatDate(expense.date)}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{expense.title}</span>
                            {expense.description && (
                              <p className="text-muted-foreground line-clamp-1 text-xs">
                                {expense.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn("gap-1 font-normal", meta.className)}
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
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
