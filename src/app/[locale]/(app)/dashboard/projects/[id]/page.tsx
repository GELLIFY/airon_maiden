import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ProjectDetail } from "@/components/airon/project-detail";
import { ProjectDetailLoading } from "@/components/airon/project-detail.loading";
import { ErrorFallback } from "@/components/error-fallback";
import { getCachedSession } from "@/libs/better-auth/get-cached-session";
import { getQueryClient, HydrateClient, trpc } from "@/libs/trpc/server";

export default async function ProjectDetailPage(
  props: PageProps<"/[locale]/dashboard/projects/[id]">,
) {
  const session = await getCachedSession();
  if (!session) return redirect("/sign-in");

  const params = await props.params;
  const projectId = params.id;

  const queryClient = getQueryClient();
  queryClient.prefetchQuery(
    trpc.airon.getProject.queryOptions({ id: projectId }),
  );

  return (
    <HydrateClient>
      <div className="border-b border-border bg-card/40 px-6 py-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="size-3.5" />
          Tutti i progetti
        </Link>
      </div>

      <div className="px-6 py-6">
        <ErrorBoundary fallbackRender={ErrorFallback}>
          <Suspense fallback={<ProjectDetailLoading />}>
            <ProjectDetail projectId={projectId} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </HydrateClient>
  );
}
