"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarRange,
  Eye,
  MapPin,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  Trash2,
} from "lucide-react";

import { deleteTrip } from "@/app/actions/trip";
import { DeleteDialog } from "@/components/delete-dialog";
import { TripDialog } from "@/components/trip-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TripWithTotals } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

/** "12 Jul 2026 – 18 Jul 2026", or a single date, or nothing. */
function formatRange(start: Date | null, end: Date | null): string | null {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return null;
}

export function TripManager({ trips }: { trips: TripWithTotals[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<TripWithTotals | null>(null);
  const [pendingDelete, setPendingDelete] =
    React.useState<TripWithTotals | null>(null);

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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Trips</h1>
          <p className="text-muted-foreground mt-1">
            Group expenses by trip so everyone can see what each one cost.
          </p>
        </div>
        <Button onClick={openAdd} className="self-start sm:self-auto">
          <Plus className="size-4" />
          Create Trip
        </Button>
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
                Create a trip, then record expenses against it.
              </p>
            </div>
            <Button onClick={openAdd} className="mt-2">
              <Plus className="size-4" />
              Create Trip
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const range = formatRange(trip.startDate, trip.endDate);

            return (
              <Card key={trip.id} className="flex flex-col transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{trip.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {trip.description || "No description"}
                    </CardDescription>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          aria-label={`Actions for ${trip.name}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/trips/${trip.id}`)}
                      >
                        <Eye className="size-4" />
                        View
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

                  <Link
                    href={`/trips/${trip.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "w-full",
                    )}
                  >
                    View expenses
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TripDialog open={dialogOpen} onOpenChange={setDialogOpen} trip={editing} />

      <DeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this trip?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium">{pendingDelete.name}</span> will be
              removed.{" "}
              {pendingDelete.expenseCount > 0 ? (
                <>
                  Its {pendingDelete.expenseCount}{" "}
                  {pendingDelete.expenseCount === 1 ? "expense" : "expenses"} will
                  be kept and moved out of the trip, so the team totals do not
                  change.
                </>
              ) : (
                <>It has no expenses.</>
              )}{" "}
              This cannot be undone.
            </>
          ) : null
        }
        onConfirm={() => deleteTrip(pendingDelete!.id)}
        successMessage="Trip deleted"
      />
    </>
  );
}
