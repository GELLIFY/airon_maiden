CREATE TABLE "acme_airon_action_item" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"project_id" uuid NOT NULL,
	"retrospective_id" uuid NOT NULL,
	"assignee_id" uuid NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(32) DEFAULT 'TO_DO' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acme_airon_card" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"retrospective_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"column" varchar(32) NOT NULL,
	"content" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acme_airon_project_member" (
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "acme_airon_project_member_project_id_user_id_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "acme_airon_project" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"name" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" varchar(32) DEFAULT 'ATTIVO' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acme_airon_retrospective" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"project_id" uuid NOT NULL,
	"name" varchar(256) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"votes_per_user" integer DEFAULT 3 NOT NULL,
	"status" varchar(32) DEFAULT 'APERTA' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acme_airon_vote" (
	"card_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "acme_airon_vote_card_id_user_id_pk" PRIMARY KEY("card_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "acme_airon_action_item" ADD CONSTRAINT "acme_airon_action_item_project_id_acme_airon_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."acme_airon_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_airon_action_item" ADD CONSTRAINT "acme_airon_action_item_retrospective_id_acme_airon_retrospective_id_fk" FOREIGN KEY ("retrospective_id") REFERENCES "public"."acme_airon_retrospective"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_airon_action_item" ADD CONSTRAINT "acme_airon_action_item_assignee_id_acme_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."acme_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_airon_card" ADD CONSTRAINT "acme_airon_card_retrospective_id_acme_airon_retrospective_id_fk" FOREIGN KEY ("retrospective_id") REFERENCES "public"."acme_airon_retrospective"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_airon_card" ADD CONSTRAINT "acme_airon_card_author_id_acme_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."acme_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_airon_project_member" ADD CONSTRAINT "acme_airon_project_member_project_id_acme_airon_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."acme_airon_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_airon_project_member" ADD CONSTRAINT "acme_airon_project_member_user_id_acme_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."acme_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_airon_retrospective" ADD CONSTRAINT "acme_airon_retrospective_project_id_acme_airon_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."acme_airon_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_airon_vote" ADD CONSTRAINT "acme_airon_vote_card_id_acme_airon_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."acme_airon_card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acme_airon_vote" ADD CONSTRAINT "acme_airon_vote_user_id_acme_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."acme_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "airon_ai_project_idx" ON "acme_airon_action_item" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "airon_ai_retro_idx" ON "acme_airon_action_item" USING btree ("retrospective_id");--> statement-breakpoint
CREATE INDEX "airon_ai_assignee_idx" ON "acme_airon_action_item" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "airon_card_retro_idx" ON "acme_airon_card" USING btree ("retrospective_id");--> statement-breakpoint
CREATE INDEX "airon_project_member_user_idx" ON "acme_airon_project_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "airon_retro_project_idx" ON "acme_airon_retrospective" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "airon_vote_user_idx" ON "acme_airon_vote" USING btree ("user_id");