CREATE TABLE "core"."access_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"label" text NOT NULL,
	"parent_resource" text,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "core"."access_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "core"."template_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"resource" text NOT NULL,
	"action" text NOT NULL,
	"scope_type" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "core"."companies" ADD COLUMN "branch_id" text;--> statement-breakpoint
ALTER TABLE "core"."users" ADD COLUMN "access_template_id" uuid;--> statement-breakpoint
ALTER TABLE "core"."access_templates" ADD CONSTRAINT "access_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "core"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."template_access" ADD CONSTRAINT "template_access_template_id_access_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "core"."access_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core"."users" ADD CONSTRAINT "users_access_template_id_access_templates_id_fk" FOREIGN KEY ("access_template_id") REFERENCES "core"."access_templates"("id") ON DELETE no action ON UPDATE no action;