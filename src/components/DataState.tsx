import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function DataState({ loading, error, empty, emptyText = "Nothing here yet.", children }: {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyText?: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  if (error) {
    return <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {(error as Error)?.message ?? "Could not load data."}
    </p>;
  }
  if (empty) return <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{emptyText}</p>;
  return <>{children}</>;
}
