"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/libs/trpc/client";
import {
  actionItemStatusValues,
  type ActionItemStatus,
} from "@/server/db/schema/airon";
import { ActionItemStatusBadge } from "./status-badge";

const statusLabels: Record<ActionItemStatus, string> = {
  TO_DO: "TO DO",
  IN_PROGRESS: "IN PROGRESS",
  DONE: "DONE",
  CANCELED: "CANCELED",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ActionItemsPanel({ projectId }: { projectId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<ActionItemStatus | null>(null);

  const queryKey = trpc.airon.listActionItems.queryKey({
    projectId,
    status: filter,
  });

  const { data } = useSuspenseQuery(
    trpc.airon.listActionItems.queryOptions({
      projectId,
      status: filter,
    }),
  );

  const updateStatus = useMutation(
    trpc.airon.updateActionItemStatus.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.airon.listActionItems.queryKey({ projectId }),
          exact: false,
        });
        await queryClient.invalidateQueries({
          queryKey: trpc.airon.listProjects.queryKey(),
        });
      },
      onError: ({ message }) => {
        toast.error(message);
      },
    }),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === null ? "default" : "outline"}
          onClick={() => setFilter(null)}
        >
          Tutti
          <span className="ml-1.5 text-xs opacity-70">({data.length})</span>
        </Button>
        {actionItemStatusValues.map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filter === s ? "default" : "outline"}
            onClick={() => setFilter(s)}
          >
            {statusLabels[s]}
          </Button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nessun action item per questo filtro.
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-start gap-2">
                  <ActionItemStatusBadge status={item.status} />
                  <h3 className="text-sm font-medium leading-tight">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Avatar size="sm">
                      <AvatarFallback>
                        {getInitials(item.assignee.name)}
                      </AvatarFallback>
                    </Avatar>
                    {item.assignee.name}
                  </div>
                  <span className="opacity-60">·</span>
                  <span>{item.retrospectiveName}</span>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button size="sm" variant="ghost" className="shrink-0">
                      Cambia stato
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  {actionItemStatusValues.map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={s === item.status}
                      onClick={() => {
                        queryClient.setQueryData(queryKey, (old) =>
                          old?.map((row) =>
                            row.id === item.id ? { ...row, status: s } : row,
                          ),
                        );
                        updateStatus.mutate({ id: item.id, status: s });
                      }}
                    >
                      {statusLabels[s]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
