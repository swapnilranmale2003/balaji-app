import { cn, formatCurrency } from "@/lib/utils";

export type Stat = {
  label: string;
  /** Currency values are formatted; strings and counts are printed as given. */
  value: number | string;
  hint?: string;
  /** Renders a negative balance in the destructive colour. */
  emphasise?: boolean;
};

/**
 * A compact row of figures. Deliberately plain — one bordered container with
 * dividers rather than a grid of shadowed cards, which reads as denser and more
 * businesslike at a glance.
 */
export function StatRow({
  stats,
  className,
}: {
  stats: Stat[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "bg-card grid divide-y rounded-lg border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4",
        "sm:[&>div]:border-r sm:[&>div:nth-child(2n)]:border-r-0",
        "lg:[&>div]:border-r lg:[&>div:nth-child(2n)]:border-r lg:[&>div:last-child]:border-r-0",
        "sm:[&>div:nth-child(n+3)]:border-t lg:[&>div:nth-child(n+3)]:border-t-0",
        className,
      )}
    >
      {stats.map(({ label, value, hint, emphasise }) => {
        const negative = typeof value === "number" && value < 0;

        return (
          <div key={label} className="px-5 py-4">
            <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {label}
            </dt>
            <dd
              className={cn(
                "mt-1.5 text-2xl font-semibold tracking-tight tabular-nums",
                emphasise && negative && "text-destructive",
              )}
            >
              {typeof value === "number" ? formatCurrency(value) : value}
            </dd>
            {hint && (
              <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
            )}
          </div>
        );
      })}
    </dl>
  );
}
