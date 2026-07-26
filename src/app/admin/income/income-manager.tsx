"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { deleteIncome } from "@/app/actions/income";
import { DeleteDialog } from "@/components/delete-dialog";
import { IncomeDialog } from "@/components/income-dialog";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PAGE_SIZE } from "@/lib/constants";
import type { IncomeRecord } from "@/lib/data";
import {
  downloadCsv,
  formatCurrency,
  formatDate,
  toCsv,
  toDateInputValue,
} from "@/lib/utils";

export function IncomeManager({ incomes }: { incomes: IncomeRecord[] }) {
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<IncomeRecord | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<IncomeRecord | null>(
    null,
  );

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return incomes;

    return incomes.filter(
      (income) =>
        income.description.toLowerCase().includes(needle) ||
        String(income.amount).includes(needle),
    );
  }, [incomes, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  React.useEffect(() => {
    setPage(1);
  }, [query]);

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const total = filtered.reduce((sum, income) => sum + income.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (income: IncomeRecord) => {
    setEditing(income);
    setDialogOpen(true);
  };

  const handleExport = () => {
    const csv = toCsv(
      ["Date", "Description", "Amount (INR)"],
      filtered.map((income) => [
        toDateInputValue(income.date),
        income.description,
        income.amount,
      ]),
    );

    downloadCsv(`income-${toDateInputValue(new Date())}.csv`, csv);
  };

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Income</h1>
          <p className="text-muted-foreground mt-1">
            Every contribution received into the team fund.
          </p>
        </div>
        <Button onClick={openAdd} className="self-start sm:self-auto">
          <Plus className="size-4" />
          Add Received Amount
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <CardTitle>All Income</CardTitle>
              <CardDescription>
                {filtered.length} of {incomes.length}{" "}
                {incomes.length === 1 ? "entry" : "entries"} ·{" "}
                <span className="font-medium tabular-nums">
                  {formatCurrency(total)}
                </span>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filtered.length === 0}
              className="self-start sm:self-auto"
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>

          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by description or amount…"
              className="pl-9"
              aria-label="Search income"
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[7rem]">Date</TableHead>
                  <TableHead className="min-w-[14rem]">Description</TableHead>
                  <TableHead className="min-w-[7rem] text-right">Amount</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-muted-foreground h-32 text-center"
                    >
                      {incomes.length === 0
                        ? "No income recorded yet."
                        : "No entries match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((income) => (
                    <TableRow key={income.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
                        {formatDate(income.date)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {income.description}
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap tabular-nums text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(income.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={`Actions for ${income.description}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(income)}>
                              <Pencil className="size-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setPendingDelete(income)}
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

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((value) => Math.min(totalPages, value + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <IncomeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        income={editing}
      />

      <DeleteDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this income entry?"
        description={
          pendingDelete ? (
            <>
              <span className="font-medium">{pendingDelete.description}</span> of{" "}
              <span className="font-medium">
                {formatCurrency(pendingDelete.amount)}
              </span>{" "}
              will be permanently removed and the remaining balance will
              recalculate. This cannot be undone.
            </>
          ) : null
        }
        onConfirm={() => deleteIncome(pendingDelete!.id)}
        successMessage="Income deleted"
      />
    </>
  );
}
