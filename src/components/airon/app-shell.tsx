"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LayoutGridIcon,
  ListChecksIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { useTRPC } from "@/libs/trpc/client";
import type { authClient } from "@/libs/better-auth/auth-client";
import { UserMenu } from "@/components/auth/user-menu";
import LanguageSelector from "@/components/navbar-components/language-selector";
import ThemeToggle from "@/components/navbar-components/theme-toggle";
import { cn } from "@/libs/utils";

type User = typeof authClient.$Infer.Session.user;

const retroDotClass: Record<string, string> = {
  APERTA: "bg-emerald-500",
  VOTING: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]",
  CHIUSA: "bg-zinc-500/45",
};

function ProjectTreeItem({
  project,
  activeProjectId,
  activeRetroId,
}: {
  project: {
    id: string;
    name: string;
    status: string;
    retros: { id: string; name: string; status: string }[];
  };
  activeProjectId?: string;
  activeRetroId?: string;
}) {
  const isActive = activeProjectId === project.id;
  const [expanded, setExpanded] = useState(isActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13.5px] transition-colors",
          isActive
            ? "text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        )}
      >
        <span className="flex size-4 shrink-0 items-center justify-center text-muted-foreground">
          {expanded ? (
            <ChevronDownIcon className="size-3.5" />
          ) : (
            <ChevronRightIcon className="size-3.5" />
          )}
        </span>
        <span
          className={cn(
            "size-2 shrink-0 rounded-full",
            project.status === "ATTIVO" ? "bg-primary" : "bg-muted-foreground/30",
          )}
        />
        <span className="truncate text-left">{project.name}</span>
      </button>

      {expanded && project.retros.length > 0 && (
        <div className="ml-5 mt-0.5 space-y-px border-l border-border/60 pl-2">
          {project.retros.map((retro) => {
            const retroActive = activeRetroId === retro.id;
            return (
              <Link
                key={retro.id}
                href={`/dashboard/projects/${project.id}/retros/${retro.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors",
                  retroActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    retroDotClass[retro.status] ?? "bg-muted-foreground/40",
                  )}
                />
                <span className="truncate">{retro.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Sidebar({ user }: { user?: User }) {
  const trpc = useTRPC();
  const params = useParams();
  const pathname = usePathname();

  const { data: projects } = useSuspenseQuery(
    trpc.airon.listProjects.queryOptions(),
  );
  const { data: sidebarRetros } = useSuspenseQuery(
    trpc.airon.listSidebarRetros.queryOptions(),
  );

  const activeProjectId = params?.id as string | undefined;
  const activeRetroId = params?.retroId as string | undefined;
  const isDashboardActive =
    pathname?.endsWith("/dashboard") || pathname === "/dashboard";

  const projectsWithRetros = projects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    retros: sidebarRetros.filter((r) => r.projectId === p.id),
  }));

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-card md:flex">
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 border-b border-border px-4 py-4"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-extrabold tracking-tight">
          Ai
        </div>
        <span className="text-base font-bold tracking-tight">Airon</span>
        <span className="ml-auto rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
          BETA
        </span>
      </Link>

      <div className="px-3 py-3">
        <div className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Viste
        </div>
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-[13.5px] transition-colors",
            isDashboardActive
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
        >
          <LayoutGridIcon className="size-4" />
          Progetti
        </Link>
        <Link
          href="/todo"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13.5px] text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <ListChecksIcon className="size-4" />
          Todos
        </Link>
      </div>

      <div className="border-t border-border px-3 py-3">
        <div className="px-1.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Progetti
        </div>
        <div className="space-y-0.5">
          {projectsWithRetros.map((p) => (
            <ProjectTreeItem
              key={p.id}
              project={p}
              activeProjectId={activeProjectId}
              activeRetroId={activeRetroId}
            />
          ))}
        </div>
      </div>

      <div className="mt-auto border-t border-border p-3">
        <div className="flex items-center gap-2">
          {user ? <UserMenu user={user} /> : null}
          <div className="ml-auto flex items-center gap-1">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user?: User;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar user={user} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
