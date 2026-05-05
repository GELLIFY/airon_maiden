"server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { DBClient } from "@/server/db";
import {
  cardTable,
  projectMemberTable,
  retrospectiveTable,
  voteTable,
  type CardColumn,
} from "@/server/db/schema/airon";

async function ensureMembership(
  db: DBClient,
  retroId: string,
  userId: string,
) {
  const [retro] = await db
    .select({
      id: retrospectiveTable.id,
      projectId: retrospectiveTable.projectId,
      status: retrospectiveTable.status,
      votesPerUser: retrospectiveTable.votesPerUser,
      name: retrospectiveTable.name,
      startDate: retrospectiveTable.startDate,
      endDate: retrospectiveTable.endDate,
    })
    .from(retrospectiveTable)
    .where(eq(retrospectiveTable.id, retroId))
    .limit(1);

  if (!retro) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Retro non trovata" });
  }

  const [member] = await db
    .select()
    .from(projectMemberTable)
    .where(
      and(
        eq(projectMemberTable.projectId, retro.projectId),
        eq(projectMemberTable.userId, userId),
      ),
    )
    .limit(1);

  if (!member) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Non sei membro" });
  }

  return retro;
}

export async function getRetroBoardQuery(
  db: DBClient,
  params: { retroId: string; userId: string },
) {
  const retro = await ensureMembership(db, params.retroId, params.userId);

  const cards = await db
    .select({
      id: cardTable.id,
      retrospectiveId: cardTable.retrospectiveId,
      authorId: cardTable.authorId,
      column: cardTable.column,
      content: cardTable.content,
      createdAt: cardTable.createdAt,
    })
    .from(cardTable)
    .where(eq(cardTable.retrospectiveId, params.retroId))
    .orderBy(asc(cardTable.createdAt));

  // votes grouped per card
  const voteRows = await db
    .select({
      cardId: voteTable.cardId,
      userId: voteTable.userId,
    })
    .from(voteTable)
    .innerJoin(cardTable, eq(voteTable.cardId, cardTable.id))
    .where(eq(cardTable.retrospectiveId, params.retroId));

  const voteCountByCard = new Map<string, number>();
  let myVotesUsed = 0;
  const myVotedCards = new Set<string>();
  for (const v of voteRows) {
    voteCountByCard.set(v.cardId, (voteCountByCard.get(v.cardId) ?? 0) + 1);
    if (v.userId === params.userId) {
      myVotesUsed += 1;
      myVotedCards.add(v.cardId);
    }
  }

  // hide content of others' cards while APERTA
  const visibleCards = cards.map((card) => {
    const isAuthor = card.authorId === params.userId;
    const hide = retro.status === "APERTA" && !isAuthor;
    return {
      id: card.id,
      column: card.column as CardColumn,
      content: hide ? "" : card.content,
      isMine: isAuthor,
      hidden: hide,
      voteCount: voteCountByCard.get(card.id) ?? 0,
      iVoted: myVotedCards.has(card.id),
    };
  });

  return {
    retro,
    cards: visibleCards,
    myVotesUsed,
    myVotesRemaining: Math.max(0, retro.votesPerUser - myVotesUsed),
  };
}

export async function createCardMutation(
  db: DBClient,
  params: {
    retroId: string;
    userId: string;
    column: CardColumn;
    content: string;
  },
) {
  const retro = await ensureMembership(db, params.retroId, params.userId);
  if (retro.status !== "APERTA") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Le card si aggiungono solo in stato APERTA",
    });
  }

  const [created] = await db
    .insert(cardTable)
    .values({
      retrospectiveId: params.retroId,
      authorId: params.userId,
      column: params.column,
      content: params.content,
    })
    .returning();

  return created;
}

export async function deleteCardMutation(
  db: DBClient,
  params: { id: string; userId: string },
) {
  const [card] = await db
    .select({
      id: cardTable.id,
      authorId: cardTable.authorId,
      retrospectiveId: cardTable.retrospectiveId,
    })
    .from(cardTable)
    .where(eq(cardTable.id, params.id))
    .limit(1);

  if (!card) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Card non trovata" });
  }
  if (card.authorId !== params.userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Puoi eliminare solo le tue card",
    });
  }

  const retro = await ensureMembership(
    db,
    card.retrospectiveId,
    params.userId,
  );
  if (retro.status !== "APERTA") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Le card si modificano solo in APERTA",
    });
  }

  await db.delete(cardTable).where(eq(cardTable.id, params.id));
  return { id: params.id };
}

export async function voteCardMutation(
  db: DBClient,
  params: { cardId: string; userId: string },
) {
  const [card] = await db
    .select({
      id: cardTable.id,
      authorId: cardTable.authorId,
      retrospectiveId: cardTable.retrospectiveId,
    })
    .from(cardTable)
    .where(eq(cardTable.id, params.cardId))
    .limit(1);

  if (!card) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Card non trovata" });
  }
  if (card.authorId === params.userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Non puoi votare le tue card",
    });
  }

  const retro = await ensureMembership(
    db,
    card.retrospectiveId,
    params.userId,
  );
  if (retro.status !== "VOTING") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Voto attivo solo in fase VOTING",
    });
  }

  // count my votes for this retro
  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(voteTable)
    .innerJoin(cardTable, eq(voteTable.cardId, cardTable.id))
    .where(
      and(
        eq(cardTable.retrospectiveId, retro.id),
        eq(voteTable.userId, params.userId),
      ),
    );
  const count = countRows[0]?.count ?? 0;

  if (count >= retro.votesPerUser) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Hai esaurito i voti disponibili",
    });
  }

  // already voted? bail (votes can't be revoked)
  const [existing] = await db
    .select()
    .from(voteTable)
    .where(
      and(
        eq(voteTable.cardId, params.cardId),
        eq(voteTable.userId, params.userId),
      ),
    )
    .limit(1);

  if (existing) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Hai già votato questa card",
    });
  }

  await db.insert(voteTable).values({
    cardId: params.cardId,
    userId: params.userId,
  });

  return { ok: true };
}

const transitions: Record<string, string | null> = {
  APERTA: "VOTING",
  VOTING: "CHIUSA",
  CHIUSA: null,
};

export async function advanceRetroStateMutation(
  db: DBClient,
  params: { retroId: string; userId: string },
) {
  const retro = await ensureMembership(db, params.retroId, params.userId);
  const next = transitions[retro.status];
  if (!next) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "La retro è già chiusa",
    });
  }

  const [updated] = await db
    .update(retrospectiveTable)
    .set({ status: next as "APERTA" | "VOTING" | "CHIUSA" })
    .where(eq(retrospectiveTable.id, params.retroId))
    .returning();

  return updated;
}
