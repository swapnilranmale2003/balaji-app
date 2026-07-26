import {
  ArrowDownCircle,
  ArrowUpCircle,
  ReceiptText,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Summary } from "@/lib/data";
import { cn, formatCurrency } from "@/lib/utils";

type CardConfig = {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  iconClass: string;
  valueClass?: string;
};

export function DashboardCards({ summary }: { summary: Summary }) {
  const { totalReceived, totalExpenses, remainingBalance, totalTransactions } =
    summary;

  const cards: CardConfig[] = [
    {
      key: "received",
      label: "Total Received",
      value: formatCurrency(totalReceived),
      hint: `${summary.incomeCount} ${summary.incomeCount === 1 ? "contribution" : "contributions"}`,
      icon: ArrowDownCircle,
      iconClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      key: "expenses",
      label: "Total Expense",
      value: formatCurrency(totalExpenses),
      hint: `${summary.expenseCount} ${summary.expenseCount === 1 ? "expense" : "expenses"} recorded`,
      icon: ArrowUpCircle,
      iconClass: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
    },
    {
      key: "balance",
      label: "Remaining Balance",
      value: formatCurrency(remainingBalance),
      hint:
        remainingBalance < 0
          ? "Spending exceeds funds received"
          : "Available to spend",
      icon: Wallet,
      iconClass: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
      // Flag an overdrawn balance rather than letting it read as a normal figure.
      valueClass: remainingBalance < 0 ? "text-destructive" : undefined,
    },
    {
      key: "transactions",
      label: "Total Transactions",
      value: String(totalTransactions),
      hint: "Income and expenses combined",
      icon: ReceiptText,
      iconClass:
        "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, label, value, hint, icon: Icon, iconClass, valueClass }) => (
        <Card key={key} className="gap-0 transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {label}
            </CardTitle>
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                iconClass,
              )}
            >
              <Icon className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold tracking-tight tabular-nums lg:text-3xl",
                valueClass,
              )}
            >
              {value}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Placeholder shown while the summary loads. */
export function DashboardCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="gap-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="size-9 rounded-lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
