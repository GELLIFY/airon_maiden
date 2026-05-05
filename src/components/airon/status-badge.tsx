import { Badge } from "@/components/ui/badge";
import type {
  ActionItemStatus,
  ProjectStatus,
  RetroStatus,
} from "@/server/db/schema/airon";

const projectStyles: Record<ProjectStatus, string> = {
  ATTIVO:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  ARCHIVIATO:
    "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
};

const retroStyles: Record<RetroStatus, string> = {
  APERTA:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  VOTING:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  CHIUSA:
    "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
};

const actionItemStyles: Record<ActionItemStatus, string> = {
  TO_DO:
    "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  IN_PROGRESS:
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  DONE:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  CANCELED:
    "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

const actionItemLabels: Record<ActionItemStatus, string> = {
  TO_DO: "TO DO",
  IN_PROGRESS: "IN PROGRESS",
  DONE: "DONE",
  CANCELED: "CANCELED",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="outline" className={projectStyles[status]}>
      {status}
    </Badge>
  );
}

export function RetroStatusBadge({ status }: { status: RetroStatus }) {
  return (
    <Badge variant="outline" className={retroStyles[status]}>
      {status}
    </Badge>
  );
}

export function ActionItemStatusBadge({
  status,
}: {
  status: ActionItemStatus;
}) {
  return (
    <Badge variant="outline" className={actionItemStyles[status]}>
      {actionItemLabels[status]}
    </Badge>
  );
}
