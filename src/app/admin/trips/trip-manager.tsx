"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { deleteTrip } from "@/app/actions/trip";
import { DeleteDialog } from "@/components/delete-dialog";
import { StatRow } from "@/components/stat-row";
import { TripDialog } from "@/components/trip-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TripWithTotals } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

/** "12 Jul 2026 – 18 Jul 2026", or a single date, or an em dash. */
function formatRange(start: Date | null, end: Date | null): string {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return "—";
}

export function TripManager({ trips }: { trips: TripWithTotals[] }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TripWithTotals | null>(null);
  const [pendingDelete, setPendingDelete] =
    React.useState<TripWithTotals | null>(null);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return trips;

    return trips.filter(
      (trip) =>
        trip.name.toLowerCase().includes(needle) ||
        trip.description.toLowerCase().includes(needle),
    );
  }, [trips, query]);

  const totals = React.useMemo(
    () =>
      trips.reduce(
        (acc, trip) => ({
          received: acc.received + trip.received,
          spent: acc.spent + trip.totalSpent,
        }),
        { received: 0, spent: 0 },
      ),
    [trips],
  );

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (trip: TripWithTotals) => {
    setEditing(trip);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Trips</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Each trip holds its own funds and expenses.
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="self-start sm:self-auto">
          <Plus className="size-4" />
          New Trip
        </Button>
      </div>

      <StatRow
        stats={[
          { label: "Trips", value: String(trips.length) },
          { label: "Total Received", value: totals.received },
          { label: "Total Spent", value: totals.spent },
          {
            label: "Balance",
            value: totals.received - totals.spent,
            emphasise: true,
          },
        ]}
      />

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          {trips.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="font-medium">No trips yet</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                Create your first trip, set how much was collected for it, then
                record expenses against it.
              </p>
              <Button size="sm" onClick={openAdd} className="mt-1">
                <Plus className="size-4" />
                New Trip
              </Button>
            </div>
          ) : (
            <>
              <div className="border-b p-3">
                <div className="relative max-w-sm">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search trips…"
                    className="h-8 pl-9"
                    aria-label="Search trips"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[12rem]">Trip</TableHead>
                      <TableHead className="min-w-[11rem]">Dates</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-muted-foreground h-24 text-center"
                        >
                          No trips match your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell>
                            <Link
                              href={`/admin/trips/${trip.id}`}
                              className="hover:underline"
                            >
                              <span className="font-medium">{trip.name}</span>
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
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                    aria-label={`Actions for ${trip.name}`}
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/admin/trips/${trip.id}`)
                                  }
                                >
                                  <Search className="size-4" />
                                  Open
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEdit(trip)}>
                                  <Pencil className="size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setPendingDelete(trip)}
                                >
                                  <Trash2 className="size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <TripDialog open={dialogOpen} onOpenChange={setDialogOpen} trip={editing} />

      <DeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this trip?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium">{pendingDelete.name}</span> and its{" "}
              {pendingDelete.expenseCount}{" "}
              {pendingDelete.expenseCount === 1 ? "expense" : "expenses"} will be
              permanently deleted. This cannot be undone.
            </>
          ) : null
        }
        onConfirm={() => deleteTrip(pendingDelete!.id)}
        successMessage="Trip deleted"
      />
    </>
  );
}
