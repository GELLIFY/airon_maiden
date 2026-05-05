"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  CalendarIcon,
  ClipboardListIcon,
  TargetIcon,
} from "lucide-react";
import Link from "next/link";
import { useTRPC } from "@/libs/trpc/client";
import { ProjectStatusBadge } from "./status-badge";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ProjectList() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.airon.listProjects.queryOptions());

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-10 text-center">
        <h3 className="font-semibold">Nessun progetto</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Non sei abilitato a nessun progetto. Chiedi a un ADMIN di
          aggiungerti.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((project) => (
        <Link
          key={project.id}
          href={`/dashboard/projects/${project.id}`}
          className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold tracking-tight">
                {project.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {project.description}
              </p>
            </div>
            <ProjectStatusBadge status={project.status} />
          </div>

          <div className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarIcon className="size-3.5" />
            <span>
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <ClipboardListIcon className="size-3" />
                RETRO
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold tabular-nums">
                  {project.retroCount}
                </span>
                {project.openRetroCount > 0 && (
                  <span className="text-[10px] font-medium text-amber-500">
                    {project.openRetroCount} attiva
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <TargetIcon className="size-3" />
                ACTION
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold tabular-nums">
                  {project.actionItemCount}
                </span>
                {project.openActionItemCount > 0 && (
                  <span className="text-[10px] font-medium text-blue-400">
                    {project.openActionItemCount} aperti
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
            Apri progetto
            <ArrowRightIcon className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}
