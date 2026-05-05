import { z } from "zod";
import {
  actionItemStatusValues,
  cardColumnValues,
  projectStatusValues,
  retroStatusValues,
} from "@/server/db/schema/airon";

export const projectStatusSchema = z.enum(projectStatusValues);
export const retroStatusSchema = z.enum(retroStatusValues);
export const actionItemStatusSchema = z.enum(actionItemStatusValues);

export const getProjectByIdSchema = z.object({
  id: z.uuid(),
});

export const listActionItemsSchema = z.object({
  projectId: z.uuid(),
  status: actionItemStatusSchema.nullable().optional(),
});

export const updateActionItemStatusSchema = z.object({
  id: z.uuid(),
  status: actionItemStatusSchema,
});

export const cardColumnSchema = z.enum(cardColumnValues);

export const getRetroBoardSchema = z.object({
  retroId: z.uuid(),
});

export const createCardSchema = z.object({
  retroId: z.uuid(),
  column: cardColumnSchema,
  content: z.string().min(1).max(500),
});

export const deleteCardSchema = z.object({
  id: z.uuid(),
});

export const voteCardSchema = z.object({
  cardId: z.uuid(),
});

export const advanceRetroStateSchema = z.object({
  retroId: z.uuid(),
});
