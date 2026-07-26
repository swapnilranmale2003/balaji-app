"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { deleteExpense } from "@/app/actions/expense";
import { DeleteDialog } from "@/components/delete-dialog";
import { ExpenseDialog } from "@/components/expense-dialog";
import { ExpenseTable } from "@/components/expense-table";
import { Button } from "@/components/ui/button";
import type { ExpenseRecord } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export function ExpenseManager({
  expenses,
  trips,
}: {
  expenses: ExpenseRecord[];
  trips: { id: string; name: string }[];
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ExpenseRecord | null>(null);
  const [pendingDelete, setPendingDelete] =
    React.useState<ExpenseRecord | null>(null);

  const openAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (expense: ExpenseRecord) => {
    setEditing(expense);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Expenses
          </h1>
          <p className="text-muted-foreground mt-1">
            Everything the team has spent from the fund.
          </p>
        </div>
        <Button onClick={openAdd} className="self-start sm:self-auto">
          <Plus className="size-4" />
          Add Expense
        </Button>
      </div>

      <ExpenseTable
        expenses={expenses}
        onEdit={openEdit}
        onDelete={setPendingDelete}
      />

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editing}
        trips={trips}
      />

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
              will be permanently removed and the remaining balance will
              recalculate. This cannot be undone.
            </>
          ) : null
        }
        onConfirm={() => deleteExpense(pendingDelete!.id)}
        successMessage="Expense deleted"
      />
    </>
  );
}
