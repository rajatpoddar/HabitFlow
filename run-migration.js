const postgres = require('postgres');

const sql = postgres('postgres://postgres:postgres@localhost:5438/habitflow');

async function main() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "ai_insights" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "week_start" text NOT NULL,
        "insights" jsonb NOT NULL,
        "summary" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    console.log('Table ai_insights created');

    try {
      await sql`ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;`;
    } catch(e) { console.log('constraint exists or error', e.message); }
    
    try {
      await sql`CREATE UNIQUE INDEX "ai_insights_user_week_idx" ON "ai_insights" USING btree ("user_id","week_start");`;
    } catch(e) { console.log('index exists or error', e.message); }
    
    console.log('Migration complete');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
main();
