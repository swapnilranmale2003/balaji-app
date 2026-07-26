"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CategoryPoint, MonthlyPoint } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

/**
 * Categorical slots assigned in fixed order and validated for colour-vision
 * deficiency against both surfaces. Never cycle or reorder these.
 */
const SERIES = {
  received: { light: "#2a78d6", dark: "#3987e5" },
  spent: { light: "#eb6834", dark: "#d95926" },
};

const CATEGORY_SLOTS = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#eb6834", dark: "#d95926" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#e87ba4", dark: "#d55181" },
];

/** Tracks the resolved theme so chart colours can be stepped for the surface. */
function useIsDark(): boolean {
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));

    update();

    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

/** Compact axis labels: 25000 -> "₹25k", 1500000 -> "₹15L". */
function formatAxisAmount(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${Math.round(value / 1_000)}k`;
  return `₹${value}`;
}

type TooltipRow = { name: string; value: number; color: string };

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; payload?: unknown }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const rows: TooltipRow[] = payload.map((item) => ({
    name: String(item.name ?? ""),
    value: Number(item.value ?? 0),
    color: item.color ?? "currentColor",
  }));

  return (
    <div className="bg-popover text-popover-foreground rounded-lg border p-3 text-sm shadow-md">
      <p className="mb-1.5 font-medium">{label}</p>
      <div className="grid gap-1">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 rounded-[2px]"
                style={{ backgroundColor: row.color }}
              />
              {row.name}
            </span>
            <span className="font-medium tabular-nums">
              {formatCurrency(row.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthlySummaryChart({ data }: { data: MonthlyPoint[] }) {
  const isDark = useIsDark();

  const received = isDark ? SERIES.received.dark : SERIES.received.light;
  const spent = isDark ? SERIES.spent.dark : SERIES.spent.light;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Summary</CardTitle>
        <CardDescription>Received against spent, month by month</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground flex h-64 items-center justify-center text-sm">
            No activity to chart yet.
          </p>
        ) : (
          <>
            {/* Legend: identity is never carried by colour alone. */}
            <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 rounded-[2px]"
                  style={{ backgroundColor: received }}
                />
                Received
              </span>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2.5 rounded-[2px]"
                  style={{ backgroundColor: spent }}
                />
                Spent
              </span>
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data}
                margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
                barGap={2}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground text-xs"
                />
                <YAxis
                  tickFormatter={formatAxisAmount}
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  className="fill-muted-foreground text-xs"
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ className: "fill-muted/40" }}
                />
                <Bar
                  dataKey="received"
                  name="Received"
                  fill={received}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Bar
                  dataKey="spent"
                  name="Spent"
                  fill={spent}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function CategoryBreakdownChart({ data }: { data: CategoryPoint[] }) {
  const isDark = useIsDark();
  const total = data.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Where the money went</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-muted-foreground flex h-64 items-center justify-center text-sm">
            No expenses to chart yet.
          </p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
              >
                <CartesianGrid
                  horizontal={false}
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  type="number"
                  tickFormatter={formatAxisAmount}
                  tickLine={false}
                  axisLine={false}
                  className="fill-muted-foreground text-xs"
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  width={92}
                  className="fill-muted-foreground text-xs"
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ className: "fill-muted/40" }}
                />
                <Bar dataKey="total" name="Spent" radius={[0, 4, 4, 0]} maxBarSize={28}>
                  {data.map((entry, index) => {
                    const slot = CATEGORY_SLOTS[index % CATEGORY_SLOTS.length];
                    return (
                      <Cell
                        key={entry.category}
                        fill={isDark ? slot.dark : slot.light}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Relief for the light-mode contrast warning: the same figures in
                text, which also serves as the accessible table view. */}
            <dl className="mt-4 grid gap-2 border-t pt-4 text-sm">
              {data.map((entry) => (
                <div key={entry.category} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{entry.category}</dt>
                  <dd className="font-medium tabular-nums">
                    {formatCurrency(entry.total)}
                    <span className="text-muted-foreground ml-2 font-normal">
                      {total > 0 ? `${Math.round((entry.total / total) * 100)}%` : "0%"}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}
