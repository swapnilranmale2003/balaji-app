import type { Metadata } from "next";

import { ExpenseManager } from "@/app/admin/expenses/expense-manager";
import { getExpenses } from "@/lib/data";

export const metadata: Metadata = {
  title: "Expenses",
};

export const dynamic = "force-dynamic";

export default async function AdminExpensesPage() {
  const expenses = await getExpenses();

  return <ExpenseManager expenses={expenses} />;
}
