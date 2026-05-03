CREATE TABLE "ai_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_start" text NOT NULL,
	"insights" jsonb NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
;
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;;
CREATE UNIQUE INDEX "ai_insights_user_week_idx" ON "ai_insights" USING btree ("user_id","week_start");