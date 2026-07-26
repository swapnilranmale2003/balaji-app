import type { Metadata } from "next";

import { ExpenseManager } from "@/app/admin/expenses/expense-manager";
import { getExpenses, getTripOptions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Expenses",
};

export const dynamic = "force-dynamic";

export default async function AdminExpensesPage() {
  const [expenses, trips] = await Promise.all([
    getExpenses(),
    getTripOptions(),
  ]);

  return <ExpenseManager expenses={expenses} trips={trips} />;
}
