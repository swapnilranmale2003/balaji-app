"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { deleteExpense } from "@/app/actions/expense";
import { DeleteDialog } from "@/components/delete-dialog";
import { ExpenseDialog } from "@/components/expense-dialog";
import { ReceivedEditor } from "@/components/received-editor";
import { TripDialog } from "@/components/trip-dialog";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORIES, getCategoryMeta } from "@/lib/constants";
import type { ExpenseRecord, TripWithTotals } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const ALL_CATEGORIES = "all";

/** "12 Jul 2026 – 18 Jul 2026", or a single date, or nothing. */
function formatRange(start: Date | null, end: Date | null): string | null {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return `From ${formatDate(start)}`;
  if (end) return `Until ${formatDate(end)}`;
  return null;
}

export function TripDetail({
  trip,
  expenses,
}: {
  trip: TripWithTotals;
  expenses: ExpenseRecord[];
}) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState(ALL_CATEGORIES);
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [editingExpense, setEditingExpense] =
    React.useState<ExpenseRecord | null>(null);
  const [tripOpen, setTripOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] =
    React.useState<ExpenseRecord | null>(null);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return expenses.filter((expense) => {
      if (category !== ALL_CATEGORIES && expense.category !== category) {
        return false;
      }
      if (!needle) return true;

      return (
        expense.title.toLowerCase().includes(needle) ||
        expense.description.toLowerCase().includes(needle) ||
        String(expense.amount).includes(needle)
      );
    });
  }, [expenses, query, category]);

  const filteredTotal = filtered.reduce((sum, item) => sum + item.amount, 0);
  const range = formatRange(trip.startDate, trip.endDate);

  const openAdd = () => {
    setEditingExpense(null);
    setExpenseOpen(true);
  };

  const openEdit = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
    setExpenseOpen(true);
  };

  return (
    <>
      <div>
        <Link
          href="/admin/trips"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Trips
        </Link>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{trip.name}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {trip.description || "No description"}
            {range && <> · {range}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTripOpen(true)}>
            <Pencil className="size-4" />
            Edit Trip
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Received is editable in place; the other two derive from it. */}
      <dl className="bg-card grid divide-y rounded-lg border sm:grid-cols-3 sm:divide-y-0">
        <div className="px-5 py-4 sm:border-r">
          <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Total Received
          </dt>
          <dd className="mt-1.5">
            <ReceivedEditor tripId={trip.id} received={trip.received} />
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
          <p className="text-muted-foreground mt-1 text-xs">
            {trip.balance < 0 ? "Over budget" : "Remaining"}
          </p>
        </div>
      </dl>

      <Card className="gap-0 py-0">
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <p className="font-medium">No expenses yet</p>
              <p className="text-muted-foreground max-w-sm text-sm">
                Add the first expense for this trip.
              </p>
              <Button size="sm" onClick={openAdd} className="mt-1">
                <Plus className="size-4" />
                Add Expense
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2 border-b p-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search expenses…"
                    className="h-8 pl-9"
                    aria-label="Search expenses"
                  />
                </div>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value ?? ALL_CATEGORIES)}
                >
                  <SelectTrigger
                    className="h-8 sm:w-44"
                    aria-label="Filter by category"
                  >
                    <SelectValue>
                      {(value: string) =>
                        value === ALL_CATEGORIES ? "All categories" : value
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                    {CATEGORIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[7rem]">Date</TableHead>
                      <TableHead className="min-w-[10rem]">Expense</TableHead>
                      <TableHead className="min-w-[8rem]">Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-muted-foreground h-24 text-center"
                        >
                          No expenses match your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((expense) => {
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
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-8"
                                      aria-label={`Actions for ${expense.title}`}
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => openEdit(expense)}
                                  >
                                    <Pencil className="size-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setPendingDelete(expense)}
                                  >
                                    <Trash2 className="size-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="text-muted-foreground flex justify-between border-t px-4 py-2.5 text-sm">
                <span>
                  {filtered.length} of {expenses.length}{" "}
                  {expenses.length === 1 ? "expense" : "expenses"}
                </span>
                <span className="text-foreground font-medium tabular-nums">
                  {formatCurrency(filteredTotal)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        expense={editingExpense}
        tripId={trip.id}
        tripName={trip.name}
      />

      <TripDialog open={tripOpen} onOpenChange={setTripOpen} trip={trip} />

      <DeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this expense?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium">{pendingDelete.title}</span> of{" "}
              <span className="font-medium">
                {formatCurrency(pendingDelete.amount)}
              </span>{" "}
              will be permanently removed. This cannot be undone.
            </>
          ) : null
        }
        onConfirm={() => deleteExpense(pendingDelete!.id)}
        successMessage="Expense deleted"
      />
    </>
  );
}
