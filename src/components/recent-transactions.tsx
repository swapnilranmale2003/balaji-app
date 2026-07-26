import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategoryMeta } from "@/lib/constants";
import type { Transaction } from "@/lib/data";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>The latest movements in the team fund</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            No transactions yet. Add received funds or an expense to get started.
          </p>
        ) : (
          <ul className="divide-y">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === "income";
              const Icon = isIncome ? ArrowDownCircle : ArrowUpCircle;

              return (
                <li
                  key={`${transaction.type}-${transaction.id}`}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      isIncome
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
                    )}
                  >
                    <Icon className="size-4.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{transaction.title}</p>
                    <p className="text-muted-foreground truncate text-sm">
                      {transaction.description || "—"}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        isIncome
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400",
                      )}
                    >
                      {isIncome ? "+" : "−"}
                      {formatCurrency(transaction.amount)}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-2 text-xs">
                      {transaction.category && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "hidden font-normal sm:inline-flex",
                            getCategoryMeta(transaction.category).className,
                          )}
                        >
                          {transaction.category}
                        </Badge>
                      )}
                      {formatDate(transaction.date)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
