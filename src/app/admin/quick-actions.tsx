"use client";

import * as React from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import { ExpenseDialog } from "@/components/expense-dialog";
import { IncomeDialog } from "@/components/income-dialog";
import { Button } from "@/components/ui/button";

/** The "Add Received Amount" / "Add Expense" pair on the admin dashboard. */
export function QuickActions({
  trips,
}: {
  trips: { id: string; name: string }[];
}) {
  const [incomeOpen, setIncomeOpen] = React.useState(false);
  const [expenseOpen, setExpenseOpen] = React.useState(false);

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={() => setIncomeOpen(true)}>
          <ArrowDownCircle className="size-4" />
          Add Received Amount
        </Button>
        <Button variant="secondary" onClick={() => setExpenseOpen(true)}>
          <ArrowUpCircle className="size-4" />
          Add Expense
        </Button>
      </div>

      <IncomeDialog open={incomeOpen} onOpenChange={setIncomeOpen} />
      <ExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        trips={trips}
      />
    </>
  );
}
