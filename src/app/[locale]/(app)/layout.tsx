import { AppShell } from "@/components/airon/app-shell";
import { getCachedSession } from "@/libs/better-auth/get-cached-session";
import { getQueryClient, HydrateClient, trpc } from "@/libs/trpc/server";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();

  const queryClient = getQueryClient();
  if (session) {
    queryClient.prefetchQuery(trpc.airon.listProjects.queryOptions());
    queryClient.prefetchQuery(trpc.airon.listSidebarRetros.queryOptions());
  }

  return (
    <HydrateClient>
      <AppShell user={session?.user}>{children}</AppShell>
    </HydrateClient>
  );
}
