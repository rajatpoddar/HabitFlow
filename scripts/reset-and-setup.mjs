/**
 * HabitFlow — Full Reset & Setup for PocketBase v0.23+ (v0.36+)
 * Uses the new "fields" API format instead of "schema"
 *
 * Usage:
 *   POCKETBASE_ADMIN_EMAIL=you@email.com \
 *   POCKETBASE_ADMIN_PASSWORD=yourpassword \
 *   node scripts/reset-and-setup.mjs
 */

const PB_URL = process.env.POCKETBASE_URL || "https://pb.palojori.in";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function pbFetch(path, options = {}) {
  const res = await fetch(`${PB_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

async function getToken() {
  const { ok, body } = await pbFetch(
    "/api/collections/_superusers/auth-with-password",
    {
      method: "POST",
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    }
  );
  if (!ok || !body.token) {
    console.error("❌  Auth failed:", body?.message);
    process.exit(1);
  }
  return body.token;
}

async function deleteIfExists(token, name) {
  const { ok, body } = await pbFetch(`/api/collections/${name}`, {
    headers: { Authorization: token },
  });
  if (!ok) return; // doesn't exist
  const { status } = await pbFetch(`/api/collections/${body.id}`, {
    method: "DELETE",
    headers: { Authorization: token },
  });
  console.log(`  🗑️   Deleted old "${name}" (status ${status})`);
}

async function createCollection(token, payload) {
  const { ok, body } = await pbFetch("/api/collections", {
    method: "POST",
    headers: { Authorization: token },
    body: JSON.stringify(payload),
  });
  if (!ok) {
    console.error(`  ❌  Failed:`, JSON.stringify(body, null, 2));
    process.exit(1);
  }
  console.log(`  ✅  "${payload.name}" created (id: ${body.id})`);
  return body.id;
}

async function main() {
  console.log(`\n🌿  HabitFlow — PocketBase v0.36 Setup`);
  console.log(`📡  ${PB_URL}\n`);

  const token = await getToken();
  console.log("✅  Authenticated\n");

  // ── Delete old empty collections if they exist ─────────────────────────────
  console.log("🧹  Cleaning up any previous empty collections...");
  // habit_logs must be deleted before habits (relation dependency)
  await deleteIfExists(token, "habit_logs");
  await deleteIfExists(token, "habits");
  await deleteIfExists(token, "journal_entries");
  console.log();

  // ── 1. habits ──────────────────────────────────────────────────────────────
  console.log("📦  Creating: habits");
  const habitsId = await createCollection(token, {
    name: "habits",
    type: "base",
    fields: [
      {
        name: "user_id",
        type: "relation",
        required: true,
        cascadeDelete: false,
        maxSelect: 1,
        collectionId: "_pb_users_auth_",
      },
      { name: "name", type: "text", required: true, min: 1, max: 200 },
      {
        name: "type",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["good", "bad"],
      },
      { name: "category", type: "text", required: true, max: 100 },
      { name: "icon", type: "text", required: true, max: 100 },
      { name: "color", type: "text", required: true, max: 20 },
      {
        name: "frequency",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["daily", "weekly"],
      },
      {
        name: "target_per_day",
        type: "number",
        required: true,
        min: 1,
        max: 100,
        noDecimal: true,
      },
      { name: "is_active", type: "bool", required: false },
    ],
    listRule: "user_id = @request.auth.id",
    viewRule: "user_id = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "user_id = @request.auth.id",
    deleteRule: "user_id = @request.auth.id",
  });

  // ── 2. habit_logs ──────────────────────────────────────────────────────────
  console.log("\n📦  Creating: habit_logs");
  await createCollection(token, {
    name: "habit_logs",
    type: "base",
    fields: [
      {
        name: "habit_id",
        type: "relation",
        required: true,
        cascadeDelete: true,
        maxSelect: 1,
        collectionId: habitsId,
      },
      { name: "date", type: "text", required: true, min: 10, max: 10 },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["done", "missed"],
      },
    ],
    listRule: "habit_id.user_id = @request.auth.id",
    viewRule: "habit_id.user_id = @request.auth.id",
    createRule:
      "@request.auth.id != '' && habit_id.user_id = @request.auth.id",
    updateRule: "habit_id.user_id = @request.auth.id",
    deleteRule: "habit_id.user_id = @request.auth.id",
  });

  // ── 3. journal_entries ─────────────────────────────────────────────────────
  console.log("\n📦  Creating: journal_entries");
  await createCollection(token, {
    name: "journal_entries",
    type: "base",
    fields: [
      {
        name: "user_id",
        type: "relation",
        required: true,
        cascadeDelete: false,
        maxSelect: 1,
        collectionId: "_pb_users_auth_",
      },
      { name: "date", type: "text", required: true, min: 10, max: 10 },
      { name: "good_text", type: "text", required: false, max: 5000 },
      { name: "bad_text", type: "text", required: false, max: 5000 },
      { name: "journal_text", type: "text", required: false, max: 10000 },
    ],
    listRule: "user_id = @request.auth.id",
    viewRule: "user_id = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "user_id = @request.auth.id",
    deleteRule: "user_id = @request.auth.id",
  });

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉  All done! Backend is fully ready.

   ✅  habits
   ✅  habit_logs
   ✅  journal_entries

Start the app:
   npm run dev

Open http://localhost:3000 and sign up!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch(console.error);
