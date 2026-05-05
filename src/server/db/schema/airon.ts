import { relations, sql } from "drizzle-orm";
import { index, primaryKey } from "drizzle-orm/pg-core";
import { timestamps } from "../utils";
import { user } from "./auth-schema";
import { createTable } from "./_table";

export const projectStatusValues = ["ATTIVO", "ARCHIVIATO"] as const;
export type ProjectStatus = (typeof projectStatusValues)[number];

export const retroStatusValues = ["APERTA", "VOTING", "CHIUSA"] as const;
export type RetroStatus = (typeof retroStatusValues)[number];

export const actionItemStatusValues = [
  "TO_DO",
  "IN_PROGRESS",
  "DONE",
  "CANCELED",
] as const;
export type ActionItemStatus = (typeof actionItemStatusValues)[number];

export const cardColumnValues = [
  "WENT_WELL",
  "TO_IMPROVE",
  "ACTION_ITEMS",
] as const;
export type CardColumn = (typeof cardColumnValues)[number];

export const projectTable = createTable("airon_project", (d) => ({
  id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
  ...timestamps,

  name: d.varchar({ length: 256 }).notNull(),
  description: d.text().notNull(),
  startDate: d.date("start_date").notNull(),
  endDate: d.date("end_date").notNull(),
  status: d.varchar({ length: 32 }).notNull().default("ATTIVO").$type<ProjectStatus>(),
}));

export const projectMemberTable = createTable(
  "airon_project_member",
  (d) => ({
    projectId: d
      .uuid("project_id")
      .references(() => projectTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: d
      .uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: d.timestamp({ withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.projectId, t.userId] }),
    index("airon_project_member_user_idx").on(t.userId),
  ],
);

export const retrospectiveTable = createTable(
  "airon_retrospective",
  (d) => ({
    id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    ...timestamps,

    projectId: d
      .uuid("project_id")
      .references(() => projectTable.id, { onDelete: "cascade" })
      .notNull(),

    name: d.varchar({ length: 256 }).notNull(),
    startDate: d.date("start_date").notNull(),
    endDate: d.date("end_date").notNull(),
    votesPerUser: d.integer("votes_per_user").notNull().default(3),
    status: d
      .varchar({ length: 32 })
      .notNull()
      .default("APERTA")
      .$type<RetroStatus>(),
  }),
  (t) => [index("airon_retro_project_idx").on(t.projectId)],
);

export const actionItemTable = createTable(
  "airon_action_item",
  (d) => ({
    id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    ...timestamps,

    projectId: d
      .uuid("project_id")
      .references(() => projectTable.id, { onDelete: "cascade" })
      .notNull(),
    retrospectiveId: d
      .uuid("retrospective_id")
      .references(() => retrospectiveTable.id, { onDelete: "cascade" })
      .notNull(),
    assigneeId: d
      .uuid("assignee_id")
      .references(() => user.id, { onDelete: "restrict" })
      .notNull(),

    title: d.varchar({ length: 256 }).notNull(),
    description: d.text().notNull(),
    status: d
      .varchar({ length: 32 })
      .notNull()
      .default("TO_DO")
      .$type<ActionItemStatus>(),
  }),
  (t) => [
    index("airon_ai_project_idx").on(t.projectId),
    index("airon_ai_retro_idx").on(t.retrospectiveId),
    index("airon_ai_assignee_idx").on(t.assigneeId),
  ],
);

export const cardTable = createTable(
  "airon_card",
  (d) => ({
    id: d.uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
    ...timestamps,

    retrospectiveId: d
      .uuid("retrospective_id")
      .references(() => retrospectiveTable.id, { onDelete: "cascade" })
      .notNull(),
    authorId: d
      .uuid("author_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),

    column: d.varchar({ length: 32 }).notNull().$type<CardColumn>(),
    content: d.text().notNull(),
  }),
  (t) => [index("airon_card_retro_idx").on(t.retrospectiveId)],
);

export const voteTable = createTable(
  "airon_vote",
  (d) => ({
    cardId: d
      .uuid("card_id")
      .references(() => cardTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: d
      .uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: d.timestamp({ withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.cardId, t.userId] }),
    index("airon_vote_user_idx").on(t.userId),
  ],
);

export const projectRelations = relations(projectTable, ({ many }) => ({
  members: many(projectMemberTable),
  retrospectives: many(retrospectiveTable),
  actionItems: many(actionItemTable),
}));

export const projectMemberRelations = relations(
  projectMemberTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [projectMemberTable.projectId],
      references: [projectTable.id],
    }),
    user: one(user, {
      fields: [projectMemberTable.userId],
      references: [user.id],
    }),
  }),
);

export const retrospectiveRelations = relations(
  retrospectiveTable,
  ({ one, many }) => ({
    project: one(projectTable, {
      fields: [retrospectiveTable.projectId],
      references: [projectTable.id],
    }),
    actionItems: many(actionItemTable),
  }),
);

export const actionItemRelations = relations(actionItemTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [actionItemTable.projectId],
    references: [projectTable.id],
  }),
  retrospective: one(retrospectiveTable, {
    fields: [actionItemTable.retrospectiveId],
    references: [retrospectiveTable.id],
  }),
  assignee: one(user, {
    fields: [actionItemTable.assigneeId],
    references: [user.id],
  }),
}));

export const cardRelations = relations(cardTable, ({ one, many }) => ({
  retrospective: one(retrospectiveTable, {
    fields: [cardTable.retrospectiveId],
    references: [retrospectiveTable.id],
  }),
  author: one(user, {
    fields: [cardTable.authorId],
    references: [user.id],
  }),
  votes: many(voteTable),
}));

export const voteRelations = relations(voteTable, ({ one }) => ({
  card: one(cardTable, {
    fields: [voteTable.cardId],
    references: [cardTable.id],
  }),
  user: one(user, {
    fields: [voteTable.userId],
    references: [user.id],
  }),
}));

export type DB_Project = typeof projectTable.$inferSelect;
export type DB_Retrospective = typeof retrospectiveTable.$inferSelect;
export type DB_ActionItem = typeof actionItemTable.$inferSelect;
export type DB_Card = typeof cardTable.$inferSelect;
export type DB_Vote = typeof voteTable.$inferSelect;
