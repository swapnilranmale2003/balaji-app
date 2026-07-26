"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { CATEGORIES, getCategoryMeta, PAGE_SIZE } from "@/lib/constants";
import type { ExpenseRecord } from "@/lib/data";
import {
  cn,
  downloadCsv,
  formatCurrency,
  formatDate,
  toCsv,
  toDateInputValue,
} from "@/lib/utils";

const ALL_CATEGORIES = "all";

type ExpenseTableProps = {
  expenses: ExpenseRecord[];
  /** When provided, an actions column with edit/delete is rendered. */
  onEdit?: (expense: ExpenseRecord) => void;
  onDelete?: (expense: ExpenseRecord) => void;
};

export function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<string>(ALL_CATEGORIES);
  const [sortDesc, setSortDesc] = React.useState(true);
  const [page, setPage] = React.useState(1);

  const showActions = Boolean(onEdit || onDelete);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matches = expenses.filter((expense) => {
      const matchesCategory =
        category === ALL_CATEGORIES || expense.category === category;

      if (!matchesCategory) return false;
      if (!needle) return true;

      return (
        expense.title.toLowerCase().includes(needle) ||
        expense.description.toLowerCase().includes(needle) ||
        expense.category.toLowerCase().includes(needle) ||
        String(expense.amount).includes(needle)
      );
    });

    return [...matches].sort((a, b) => {
      const diff = a.date.getTime() - b.date.getTime();
      return sortDesc ? -diff : diff;
    });
  }, [expenses, query, category, sortDesc]);

  // Keep the page in range when filters shrink the result set.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  React.useEffect(() => {
    setPage(1);
  }, [query, category]);

  const paginated = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const filteredTotal = filtered.reduce((sum, item) => sum + item.amount, 0);

  const handleExport = () => {
    const csv = toCsv(
      ["Date", "Expense Name", "Category", "Description", "Amount (INR)"],
      filtered.map((expense) => [
        toDateInputValue(expense.date),
        expense.title,
        expense.category,
        expense.description,
        expense.amount,
      ]),
    );

    downloadCsv(`expenses-${toDateInputValue(new Date())}.csv`, csv);
  };

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Expense History</CardTitle>
            <CardDescription>
              {filtered.length} of {expenses.length}{" "}
              {expenses.length === 1 ? "expense" : "expenses"} ·{" "}
              <span className="font-medium tabular-nums">
                {formatCurrency(filteredTotal)}
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

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, description or amount…"
              className="pl-9"
              aria-label="Search expenses"
            />
          </div>

          <Select
            value={category}
            onValueChange={(value) => setCategory(value ?? ALL_CATEGORIES)}
          >
            <SelectTrigger className="sm:w-48" aria-label="Filter by category">
              {/* Base UI renders the raw value by default, so map it back to
                  the human-readable label. */}
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
      </CardHeader>

      <CardContent>
        {/* Horizontal scroll keeps the table usable on narrow screens
            without squeezing columns into unreadable widths. */}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[7rem]">
                  <button
                    type="button"
                    onClick={() => setSortDesc((value) => !value)}
                    className="hover:text-foreground -ml-1 flex items-center gap-1 rounded px-1 py-0.5 font-medium transition-colors"
                    aria-label={`Sort by date, currently ${sortDesc ? "newest" : "oldest"} first`}
                  >
                    Date
                    <ArrowUpDown className="size-3.5" />
                  </button>
                </TableHead>
                <TableHead className="min-w-[9rem]">Expense Name</TableHead>
                <TableHead className="min-w-[8rem]">Category</TableHead>
                <TableHead className="min-w-[12rem]">Description</TableHead>
                <TableHead className="min-w-[7rem] text-right">Amount</TableHead>
                {showActions && (
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showActions ? 6 : 5}
                    className="text-muted-foreground h-32 text-center"
                  >
                    {expenses.length === 0
                      ? "No expenses recorded yet."
                      : "No expenses match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((expense) => {
                  const meta = getCategoryMeta(expense.category);
                  const Icon = meta.icon;

                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap tabular-nums">
                        {formatDate(expense.date)}
                      </TableCell>
                      <TableCell className="font-medium">{expense.title}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("gap-1 font-normal", meta.className)}
                        >
                          <Icon className="size-3" />
                          {expense.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs">
                        <span className="line-clamp-2">
                          {expense.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      {showActions && (
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
                              {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(expense)}>
                                  <Pencil className="size-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => onDelete(expense)}
                                >
                                  <Trash2 className="size-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
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
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
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
  );
}
