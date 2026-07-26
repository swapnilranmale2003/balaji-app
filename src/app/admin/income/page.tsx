import type { Metadata } from "next";

import { IncomeManager } from "@/app/admin/income/income-manager";
import { getIncomes } from "@/lib/data";

export const metadata: Metadata = {
  title: "Income",
};

export const dynamic = "force-dynamic";

export default async function AdminIncomePage() {
  const incomes = await getIncomes();

  return <IncomeManager incomes={incomes} />;
}
