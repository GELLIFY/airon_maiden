import { TRPCError } from "@trpc/server";
import {
  advanceRetroStateMutation,
  createCardMutation,
  deleteCardMutation,
  getRetroBoardQuery,
  voteCardMutation,
} from "@/server/domains/airon/board";
import { updateActionItemStatusMutation } from "@/server/domains/airon/mutations";
import {
  getProjectDetailQuery,
  listActionItemsQuery,
  listProjectsForUserQuery,
  listSidebarRetrosQuery,
} from "@/server/domains/airon/queries";
import {
  advanceRetroStateSchema,
  createCardSchema,
  deleteCardSchema,
  getProjectByIdSchema,
  getRetroBoardSchema,
  listActionItemsSchema,
  updateActionItemStatusSchema,
  voteCardSchema,
} from "@/shared/validators/airon.schema";
import { createTRPCRouter, protectedProcedure } from "../init";

export const aironRouter = createTRPCRouter({
  listProjects: protectedProcedure.query(
    async ({ ctx: { db, session } }) => {
      return await listProjectsForUserQuery(db, session.user.id);
    },
  ),

  listSidebarRetros: protectedProcedure.query(
    async ({ ctx: { db, session } }) => {
      return await listSidebarRetrosQuery(db, session.user.id);
    },
  ),

  getProject: protectedProcedure
    .input(getProjectByIdSchema)
    .query(async ({ ctx: { db, session }, input }) => {
      const result = await getProjectDetailQuery(db, {
        projectId: input.id,
        userId: session.user.id,
      });
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or access denied",
        });
      }
      return result;
    }),

  listActionItems: protectedProcedure
    .input(listActionItemsSchema)
    .query(async ({ ctx: { db, session }, input }) => {
      return await listActionItemsQuery(db, {
        projectId: input.projectId,
        userId: session.user.id,
        status: input.status,
      });
    }),

  updateActionItemStatus: protectedProcedure
    .input(updateActionItemStatusSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return await updateActionItemStatusMutation(db, {
        ...input,
        userId: session.user.id,
      });
    }),

  getBoard: protectedProcedure
    .input(getRetroBoardSchema)
    .query(async ({ ctx: { db, session }, input }) => {
      return await getRetroBoardQuery(db, {
        retroId: input.retroId,
        userId: session.user.id,
      });
    }),

  createCard: protectedProcedure
    .input(createCardSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return await createCardMutation(db, {
        ...input,
        userId: session.user.id,
      });
    }),

  deleteCard: protectedProcedure
    .input(deleteCardSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return await deleteCardMutation(db, {
        id: input.id,
        userId: session.user.id,
      });
    }),

  voteCard: protectedProcedure
    .input(voteCardSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return await voteCardMutation(db, {
        cardId: input.cardId,
        userId: session.user.id,
      });
    }),

  advanceRetroState: protectedProcedure
    .input(advanceRetroStateSchema)
    .mutation(async ({ ctx: { db, session }, input }) => {
      return await advanceRetroStateMutation(db, {
        retroId: input.retroId,
        userId: session.user.id,
      });
    }),
});
