"use client";

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  CheckIcon,
  ChevronRightIcon,
  EyeOffIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/libs/trpc/client";
import { cn } from "@/libs/utils";
import type { CardColumn, RetroStatus } from "@/server/db/schema/airon";

const columnOrder: CardColumn[] = ["WENT_WELL", "TO_IMPROVE", "ACTION_ITEMS"];

const columnConfig: Record<
  CardColumn,
  {
    title: string;
    icon: React.ReactNode;
    iconBg: string;
    iconText: string;
    titleColor: string;
    border: string;
    cardBg: string;
    cardText: string;
    pip: string;
    voteBtnBg: string;
    voteBtnHover: string;
    addBorder: string;
    addText: string;
    addHover: string;
  }
> = {
  WENT_WELL: {
    title: "Went Well",
    icon: <CheckIcon className="size-3.5" strokeWidth={3} />,
    iconBg: "bg-emerald-200",
    iconText: "text-emerald-800",
    titleColor: "text-emerald-500",
    border: "border-emerald-400/50",
    cardBg: "bg-emerald-100",
    cardText: "text-emerald-900",
    pip: "bg-emerald-500",
    voteBtnBg: "bg-emerald-200 text-emerald-900",
    voteBtnHover: "hover:bg-emerald-300",
    addBorder: "border-emerald-400/30 hover:border-emerald-400",
    addText: "text-emerald-400/60 hover:text-emerald-400",
    addHover: "hover:bg-emerald-500/5",
  },
  TO_IMPROVE: {
    title: "To Improve",
    icon: <TriangleAlertIcon className="size-3.5" strokeWidth={2.5} />,
    iconBg: "bg-orange-200",
    iconText: "text-orange-800",
    titleColor: "text-orange-500",
    border: "border-orange-400/50",
    cardBg: "bg-orange-100",
    cardText: "text-orange-900",
    pip: "bg-orange-500",
    voteBtnBg: "bg-orange-200 text-orange-900",
    voteBtnHover: "hover:bg-orange-300",
    addBorder: "border-orange-400/30 hover:border-orange-400",
    addText: "text-orange-400/60 hover:text-orange-400",
    addHover: "hover:bg-orange-500/5",
  },
  ACTION_ITEMS: {
    title: "Action Items",
    icon: <ZapIcon className="size-3.5" strokeWidth={2.5} />,
    iconBg: "bg-indigo-200",
    iconText: "text-indigo-800",
    titleColor: "text-indigo-400",
    border: "border-indigo-400/50",
    cardBg: "bg-indigo-100",
    cardText: "text-indigo-900",
    pip: "bg-indigo-500",
    voteBtnBg: "bg-indigo-200 text-indigo-900",
    voteBtnHover: "hover:bg-indigo-300",
    addBorder: "border-indigo-400/30 hover:border-indigo-400",
    addText: "text-indigo-400/60 hover:text-indigo-400",
    addHover: "hover:bg-indigo-500/5",
  },
};

const statusOrder: RetroStatus[] = ["APERTA", "VOTING", "CHIUSA"];
const statusLabels: Record<RetroStatus, string> = {
  APERTA: "APERTA",
  VOTING: "VOTING",
  CHIUSA: "CHIUSA",
};
const statusSubs: Record<RetroStatus, string> = {
  APERTA: "Scrittura card",
  VOTING: "Dot voting attivo",
  CHIUSA: "Sola lettura",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RetroBoard({ retroId }: { retroId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const queryKey = trpc.airon.getBoard.queryKey({ retroId });
  const { data } = useSuspenseQuery(
    trpc.airon.getBoard.queryOptions({ retroId }),
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({
      queryKey: trpc.airon.listProjects.queryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: trpc.airon.listSidebarRetros.queryKey(),
    });
  };

  const createCard = useMutation(
    trpc.airon.createCard.mutationOptions({
      onSuccess: invalidate,
      onError: ({ message }) => toast.error(message),
    }),
  );
  const deleteCard = useMutation(
    trpc.airon.deleteCard.mutationOptions({
      onSuccess: invalidate,
      onError: ({ message }) => toast.error(message),
    }),
  );
  const voteCard = useMutation(
    trpc.airon.voteCard.mutationOptions({
      onSuccess: invalidate,
      onError: ({ message }) => toast.error(message),
    }),
  );
  const advance = useMutation(
    trpc.airon.advanceRetroState.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Stato retrospettiva aggiornato");
      },
      onError: ({ message }) => toast.error(message),
    }),
  );

  const { retro, cards, myVotesUsed, myVotesRemaining } = data;
  const isOpen = retro.status === "APERTA";
  const isVoting = retro.status === "VOTING";
  const currentStatusIdx = statusOrder.indexOf(retro.status);

  const cardsByColumn: Record<CardColumn, typeof cards> = {
    WENT_WELL: cards.filter((c) => c.column === "WENT_WELL"),
    TO_IMPROVE: cards.filter((c) => c.column === "TO_IMPROVE"),
    ACTION_ITEMS: cards.filter((c) => c.column === "ACTION_ITEMS"),
  };

  const nextLabel =
    retro.status === "APERTA"
      ? "Avanza a VOTING"
      : retro.status === "VOTING"
        ? "Avanza a CHIUSA"
        : null;

  return (
    <div className="flex min-h-[calc(100vh-1px)] flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/40 px-6 py-5">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {retro.name}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDate(retro.startDate)} → {formatDate(retro.endDate)}
              <span className="mx-2 opacity-50">·</span>
              {retro.votesPerUser} voti per utente
            </p>
          </div>
          {nextLabel && (
            <Button
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => advance.mutate({ retroId })}
              disabled={advance.isPending}
            >
              {nextLabel}
              <ChevronRightIcon className="ml-0.5 size-3.5" />
            </Button>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center">
          {statusOrder.map((s, idx) => {
            const isDone = idx < currentStatusIdx;
            const isActive = idx === currentStatusIdx;
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                      isDone && "bg-emerald-500 text-white",
                      isActive &&
                        "bg-amber-600 text-white shadow-[0_0_0_4px_rgba(217,119,6,0.2)]",
                      !isDone && !isActive && "bg-muted text-muted-foreground",
                    )}
                  >
                    {isDone ? (
                      <CheckIcon className="size-3.5" strokeWidth={3} />
                    ) : isActive ? (
                      "●"
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        isDone && "text-emerald-500",
                        isActive && "text-amber-500",
                        !isDone && !isActive && "text-muted-foreground",
                      )}
                    >
                      {statusLabels[s]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {statusSubs[s]}
                    </span>
                  </div>
                </div>
                {idx < statusOrder.length - 1 && (
                  <div
                    className={cn(
                      "mx-3 h-0.5 w-12 rounded-full",
                      idx < currentStatusIdx ? "bg-emerald-500" : "bg-muted",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Voting banner */}
      {isVoting && (
        <div className="mx-6 mt-3 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-900/15 to-amber-700/8 px-4 py-2.5">
          <span className="text-base">🗳️</span>
          <span className="flex-1 text-sm text-amber-200">
            <strong className="text-amber-100">Fase VOTING.</strong> Hai{" "}
            <strong className="text-amber-100">
              {myVotesRemaining}/{retro.votesPerUser}
            </strong>{" "}
            voti rimasti. Non puoi votare le tue card.
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: retro.votesPerUser }).map((_, i) => (
              <div
                key={`pip-${i.toString()}`}
                className={cn(
                  "size-2.5 rounded-full",
                  i < myVotesUsed
                    ? "bg-muted"
                    : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
                )}
              />
            ))}
          </div>
        </div>
      )}

      {isOpen && (
        <div className="mx-6 mt-3 flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-900/15 px-4 py-2.5">
          <EyeOffIcon className="size-4 text-sky-300" />
          <span className="flex-1 text-sm text-sky-200">
            <strong className="text-sky-100">Fase APERTA.</strong> Le card
            degli altri sono nascoste finché non si passa a VOTING.
          </span>
        </div>
      )}

      {/* Board */}
      <div className="flex flex-1 gap-4 overflow-x-auto px-6 py-5">
        {columnOrder.map((col) => {
          const cfg = columnConfig[col];
          const columnCards = cardsByColumn[col];
          return (
            <div key={col} className="flex min-w-[270px] flex-1 flex-col gap-3">
              <div
                className={cn(
                  "flex items-center justify-between border-b-2 pb-1.5",
                  cfg.border,
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 text-xs font-bold uppercase tracking-wide",
                    cfg.titleColor,
                  )}
                >
                  <div
                    className={cn(
                      "flex size-5 items-center justify-center rounded",
                      cfg.iconBg,
                      cfg.iconText,
                    )}
                  >
                    {cfg.icon}
                  </div>
                  {cfg.title}
                </div>
                <span className="rounded-full bg-muted px-2 py-px text-xs font-semibold text-muted-foreground">
                  {columnCards.length}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {columnCards.map((card, idx) => (
                  <div
                    key={card.id}
                    className={cn(
                      "group/card relative rounded-tl-sm rounded-tr-[10px] rounded-br-[10px] rounded-bl-[10px] px-3.5 py-3 shadow-[2px_3px_10px_rgba(0,0,0,.25),inset_0_-3px_0_rgba(0,0,0,.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,.35)]",
                      cfg.cardBg,
                      idx % 2 === 0 ? "rotate-[-0.4deg]" : "rotate-[0.3deg]",
                    )}
                  >
                    {card.isMine && isOpen && (
                      <button
                        type="button"
                        onClick={() => deleteCard.mutate({ id: card.id })}
                        className={cn(
                          "absolute right-2 top-2 hidden size-6 items-center justify-center rounded bg-black/10 group-hover/card:flex",
                          cfg.cardText,
                        )}
                        aria-label="Elimina card"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    )}

                    <div
                      className={cn(
                        "mb-2.5 text-sm leading-snug",
                        cfg.cardText,
                        card.hidden && "italic opacity-50",
                      )}
                    >
                      {card.hidden
                        ? "Card nascosta — visibile in fase VOTING"
                        : card.content}
                    </div>

                    <div className="flex items-center justify-between">
                      {isVoting && !card.isMine && !card.iVoted && myVotesRemaining > 0 ? (
                        <button
                          type="button"
                          onClick={() => voteCard.mutate({ cardId: card.id })}
                          className={cn(
                            "rounded px-2 py-0.5 text-xs font-semibold transition-colors",
                            cfg.voteBtnBg,
                            cfg.voteBtnHover,
                          )}
                        >
                          ▲ Vota
                        </button>
                      ) : (
                        <span
                          className={cn(
                            "text-[11px] font-medium",
                            cfg.cardText,
                            "opacity-60",
                          )}
                        >
                          {card.isMine
                            ? "Tua card"
                            : card.iVoted
                              ? "✓ Votata"
                              : ""}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          {Array.from({
                            length: Math.min(card.voteCount, 5),
                          }).map((_, i) => (
                            <div
                              key={`vp-${card.id}-${i.toString()}`}
                              className={cn("size-2 rounded-full", cfg.pip)}
                            />
                          ))}
                        </div>
                        <span
                          className={cn(
                            "text-sm font-bold tabular-nums",
                            cfg.cardText,
                          )}
                        >
                          {card.voteCount}
                        </span>
                      </div>
                    </div>

                    {!card.isMine && !card.hidden && (
                      <div
                        className={cn(
                          "mt-1.5 flex items-center gap-1 text-[10px] opacity-50",
                          cfg.cardText,
                        )}
                      >
                        Anonimo
                      </div>
                    )}
                  </div>
                ))}

                <AddCardButton
                  retroId={retroId}
                  column={col}
                  disabled={!isOpen}
                  onCreate={(content) =>
                    createCard.mutate({ retroId, column: col, content })
                  }
                  cfg={cfg}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddCardButton({
  column,
  disabled,
  onCreate,
  cfg,
}: {
  retroId: string;
  column: CardColumn;
  disabled: boolean;
  onCreate: (content: string) => void;
  cfg: (typeof columnConfig)[CardColumn];
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (disabled) {
    return (
      <div
        className={cn(
          "flex cursor-not-allowed items-center gap-2 rounded-lg border-2 border-dashed border-muted px-3.5 py-2.5 text-sm font-medium text-muted-foreground/50",
        )}
      >
        <PlusIcon className="size-3.5" />
        Aggiungi card (solo in APERTA)
      </div>
    );
  }

  if (open) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border-2 border-dashed border-border bg-card p-3">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Scrivi la tua card..."
          className="min-h-20 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setOpen(false);
              setValue("");
            }}
          >
            Annulla
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const trimmed = value.trim();
              if (!trimmed) return;
              onCreate(trimmed);
              setValue("");
              setOpen(false);
            }}
          >
            Aggiungi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 border-dashed px-3.5 py-2.5 text-sm font-medium transition-all",
        cfg.addBorder,
        cfg.addText,
        cfg.addHover,
      )}
    >
      <PlusIcon className="size-3.5" />
      Aggiungi {column === "ACTION_ITEMS" ? "Action Item" : "card"}
    </button>
  );
}
