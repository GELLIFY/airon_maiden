import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectListLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={`skeleton-${i.toString()}`}>
          <CardHeader>
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-4/5" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-2/3" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
