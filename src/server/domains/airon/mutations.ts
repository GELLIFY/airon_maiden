"server-only";

import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { DBClient } from "@/server/db";
import { actionItemTable, projectMemberTable } from "@/server/db/schema/airon";
import type { ActionItemStatus } from "@/server/db/schema/airon";

export async function updateActionItemStatusMutation(
  db: DBClient,
  params: { id: string; status: ActionItemStatus; userId: string },
) {
  const [item] = await db
    .select({ projectId: actionItemTable.projectId })
    .from(actionItemTable)
    .where(eq(actionItemTable.id, params.id))
    .limit(1);

  if (!item) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Action item not found" });
  }

  const [membership] = await db
    .select()
    .from(projectMemberTable)
    .where(
      and(
        eq(projectMemberTable.projectId, item.projectId),
        eq(projectMemberTable.userId, params.userId),
      ),
    )
    .limit(1);

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not a member of this project",
    });
  }

  const [updated] = await db
    .update(actionItemTable)
    .set({ status: params.status })
    .where(eq(actionItemTable.id, params.id))
    .returning();

  return updated;
}
