import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { RetroBoard } from "@/components/airon/retro-board";
import { RetroBoardLoading } from "@/components/airon/retro-board.loading";
import { ErrorFallback } from "@/components/error-fallback";
import { getCachedSession } from "@/libs/better-auth/get-cached-session";
import { getQueryClient, HydrateClient, trpc } from "@/libs/trpc/server";

export default async function RetroBoardPage(
  props: PageProps<"/[locale]/dashboard/projects/[id]/retros/[retroId]">,
) {
  const session = await getCachedSession();
  if (!session) return redirect("/sign-in");

  const params = await props.params;
  const projectId = params.id;
  const retroId = params.retroId;

  const queryClient = getQueryClient();
  queryClient.prefetchQuery(
    trpc.airon.getBoard.queryOptions({ retroId }),
  );

  return (
    <HydrateClient>
      <div className="border-b border-border bg-card/40 px-6 py-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground"
          >
            Progetti
          </Link>
          <ChevronRightIcon className="size-3 opacity-50" />
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="transition-colors hover:text-foreground"
          >
            Progetto
          </Link>
          <ChevronRightIcon className="size-3 opacity-50" />
          <span className="font-semibold text-foreground">Retrospettiva</span>
        </div>
      </div>

      <ErrorBoundary fallbackRender={ErrorFallback}>
        <Suspense fallback={<RetroBoardLoading />}>
          <RetroBoard retroId={retroId} />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
