import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className="bg-card grid divide-y rounded-lg border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
      {Array.from({ length: cols }).map((_, index) => (
        <div key={index} className="px-5 py-4 lg:border-r lg:last:border-r-0">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2.5 h-7 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-0">
        <div className="border-b px-4 py-3">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-3.5">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="hidden h-4 w-32 sm:block" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PageSkeleton() {
  return (
    <>
      <div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <StatRowSkeleton />
      <TableSkeleton />
    </>
  );
}
