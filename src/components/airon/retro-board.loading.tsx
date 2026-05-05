import { Skeleton } from "@/components/ui/skeleton";

export function RetroBoardLoading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
