"server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { DBClient } from "@/server/db";
import {
  actionItemTable,
  projectMemberTable,
  projectTable,
  retrospectiveTable,
} from "@/server/db/schema/airon";
import { user } from "@/server/db/schema/auth-schema";
import type { ActionItemStatus } from "@/server/db/schema/airon";

export async function listProjectsForUserQuery(
  db: DBClient,
  userId: string,
) {
  const memberships = await db
    .select({ projectId: projectMemberTable.projectId })
    .from(projectMemberTable)
    .where(eq(projectMemberTable.userId, userId));

  const projectIds = memberships.map((m) => m.projectId);
  if (projectIds.length === 0) return [];

  const projects = await db
    .select()
    .from(projectTable)
    .where(inArray(projectTable.id, projectIds))
    .orderBy(desc(projectTable.createdAt));

  const retros = await db
    .select({
      id: retrospectiveTable.id,
      projectId: retrospectiveTable.projectId,
      status: retrospectiveTable.status,
    })
    .from(retrospectiveTable)
    .where(inArray(retrospectiveTable.projectId, projectIds));

  const actionItems = await db
    .select({
      id: actionItemTable.id,
      projectId: actionItemTable.projectId,
      status: actionItemTable.status,
    })
    .from(actionItemTable)
    .where(inArray(actionItemTable.projectId, projectIds));

  return projects.map((project) => {
    const projectRetros = retros.filter((r) => r.projectId === project.id);
    const projectAis = actionItems.filter((a) => a.projectId === project.id);
    const openAis = projectAis.filter(
      (a) => a.status === "TO_DO" || a.status === "IN_PROGRESS",
    );
    return {
      ...project,
      retroCount: projectRetros.length,
      openRetroCount: projectRetros.filter((r) => r.status !== "CHIUSA").length,
      actionItemCount: projectAis.length,
      openActionItemCount: openAis.length,
    };
  });
}

export async function getProjectDetailQuery(
  db: DBClient,
  params: { projectId: string; userId: string },
) {
  const [membership] = await db
    .select()
    .from(projectMemberTable)
    .where(
      and(
        eq(projectMemberTable.projectId, params.projectId),
        eq(projectMemberTable.userId, params.userId),
      ),
    )
    .limit(1);

  if (!membership) return null;

  const [project] = await db
    .select()
    .from(projectTable)
    .where(eq(projectTable.id, params.projectId))
    .limit(1);

  if (!project) return null;

  const retros = await db
    .select()
    .from(retrospectiveTable)
    .where(eq(retrospectiveTable.projectId, params.projectId))
    .orderBy(desc(retrospectiveTable.startDate));

  const members = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(projectMemberTable)
    .innerJoin(user, eq(projectMemberTable.userId, user.id))
    .where(eq(projectMemberTable.projectId, params.projectId))
    .orderBy(asc(user.name));

  return { project, retros, members };
}

export async function listActionItemsQuery(
  db: DBClient,
  params: {
    projectId: string;
    userId: string;
    status?: ActionItemStatus | null;
  },
) {
  const [membership] = await db
    .select()
    .from(projectMemberTable)
    .where(
      and(
        eq(projectMemberTable.projectId, params.projectId),
        eq(projectMemberTable.userId, params.userId),
      ),
    )
    .limit(1);

  if (!membership) return [];

  const where = [eq(actionItemTable.projectId, params.projectId)];
  if (params.status) {
    where.push(eq(actionItemTable.status, params.status));
  }

  return await db
    .select({
      id: actionItemTable.id,
      title: actionItemTable.title,
      description: actionItemTable.description,
      status: actionItemTable.status,
      retrospectiveId: actionItemTable.retrospectiveId,
      retrospectiveName: retrospectiveTable.name,
      assignee: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      createdAt: actionItemTable.createdAt,
    })
    .from(actionItemTable)
    .innerJoin(user, eq(actionItemTable.assigneeId, user.id))
    .innerJoin(
      retrospectiveTable,
      eq(actionItemTable.retrospectiveId, retrospectiveTable.id),
    )
    .where(and(...where))
    .orderBy(desc(actionItemTable.createdAt));
}

export async function listSidebarRetrosQuery(
  db: DBClient,
  userId: string,
) {
  const memberships = await db
    .select({ projectId: projectMemberTable.projectId })
    .from(projectMemberTable)
    .where(eq(projectMemberTable.userId, userId));

  const projectIds = memberships.map((m) => m.projectId);
  if (projectIds.length === 0) return [];

  return await db
    .select({
      id: retrospectiveTable.id,
      projectId: retrospectiveTable.projectId,
      name: retrospectiveTable.name,
      status: retrospectiveTable.status,
    })
    .from(retrospectiveTable)
    .where(inArray(retrospectiveTable.projectId, projectIds))
    .orderBy(desc(retrospectiveTable.startDate));
}

export async function userIsProjectMemberQuery(
  db: DBClient,
  params: { projectId: string; userId: string },
) {
  const [membership] = await db
    .select()
    .from(projectMemberTable)
    .where(
      and(
        eq(projectMemberTable.projectId, params.projectId),
        eq(projectMemberTable.userId, params.userId),
      ),
    )
    .limit(1);
  return Boolean(membership);
}
