import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ProjectList } from "@/components/airon/project-list";
import { ProjectListLoading } from "@/components/airon/project-list.loading";
import { ErrorFallback } from "@/components/error-fallback";
import { getCachedSession } from "@/libs/better-auth/get-cached-session";
import { getQueryClient, HydrateClient, trpc } from "@/libs/trpc/server";

export default async function DashboardPage() {
  const session = await getCachedSession();
  if (!session) return redirect("/sign-in");

  const queryClient = getQueryClient();
  queryClient.prefetchQuery(trpc.airon.listProjects.queryOptions());

  return (
    <HydrateClient>
      <div className="border-b border-border bg-card/40 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Progetti</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Le retrospettive del tuo team, in un colpo d'occhio.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <ErrorBoundary fallbackRender={ErrorFallback}>
          <Suspense fallback={<ProjectListLoading />}>
            <ProjectList />
          </Suspense>
        </ErrorBoundary>
      </div>
    </HydrateClient>
  );
}
