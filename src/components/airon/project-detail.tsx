"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRightIcon, CalendarIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useTRPC } from "@/libs/trpc/client";
import { ActionItemsPanel } from "./action-items-panel";
import { ProjectStatusBadge, RetroStatusBadge } from "./status-badge";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ProjectDetail({ projectId }: { projectId: string }) {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.airon.getProject.queryOptions({ id: projectId }),
  );

  const { project, retros, members } = data;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              {project.description}
            </p>
          </div>
          <ProjectStatusBadge status={project.status} />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="size-4" />
            {formatDate(project.startDate)} → {formatDate(project.endDate)}
          </div>
          <div className="flex items-center gap-1.5">
            <UsersIcon className="size-4" />
            {members.length} membri
          </div>
        </div>
      </header>

      <Tabs defaultValue="retros">
        <TabsList>
          <TabsTrigger value="retros">
            Retrospettive ({retros.length})
          </TabsTrigger>
          <TabsTrigger value="action-items">Action Items</TabsTrigger>
          <TabsTrigger value="members">Membri ({members.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="retros" className="mt-4">
          {retros.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Nessuna retrospettiva creata per questo progetto.
            </div>
          ) : (
            <div className="space-y-2">
              {retros.map((retro) => (
                <Link
                  key={retro.id}
                  href={`/dashboard/projects/${projectId}/retros/${retro.id}`}
                  className="group flex items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{retro.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(retro.startDate)} →{" "}
                      {formatDate(retro.endDate)} · {retro.votesPerUser} voti/utente
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RetroStatusBadge status={retro.status} />
                    <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="action-items" className="mt-4">
          <ActionItemsPanel projectId={projectId} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border bg-card p-3"
              >
                <Avatar>
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {member.name}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {member.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
