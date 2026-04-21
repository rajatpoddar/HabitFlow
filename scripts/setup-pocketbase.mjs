/**
 * HabitFlow — PocketBase Auto Setup Script
 *
 * Usage (with credentials):
 *   POCKETBASE_ADMIN_EMAIL=you@email.com \
 *   POCKETBASE_ADMIN_PASSWORD=yourpassword \
 *   node scripts/setup-pocketbase.mjs
 *
 * Usage (with token copied from browser devtools):
 *   POCKETBASE_ADMIN_TOKEN="your_token_here" \
 *   node scripts/setup-pocketbase.mjs
 */

const PB_URL = process.env.POCKETBASE_URL || "https://pb.palojori.in";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
const ADMIN_TOKEN = process.env.POCKETBASE_ADMIN_TOKEN;

if (!ADMIN_EMAIL && !ADMIN_PASSWORD && !ADMIN_TOKEN) {
  console.error(`
❌  Missing credentials. Run like this:

  POCKETBASE_ADMIN_EMAIL=you@email.com \\
  POCKETBASE_ADMIN_PASSWORD=yourpassword \\
  node scripts/setup-pocketbase.mjs

Or with a token from your browser (see instructions below):

  POCKETBASE_ADMIN_TOKEN="eyJhbGci..." \\
  node scripts/setup-pocketbase.mjs
`);
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function pbFetch(path, options = {}) {
  const res = await fetch(`${PB_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

// Try every known PocketBase admin auth endpoint (v0.20, v0.21, v0.22, v0.23+)
async function getAdminToken() {
  if (ADMIN_TOKEN) {
    console.log("�  Using provided token\n");
    return ADMIN_TOKEN;
  }

  const endpoints = [
    "/api/collections/_superusers/auth-with-password", // PocketBase v0.23+ (v0.36+)
    "/api/admins/auth-with-password",                  // PocketBase < v0.23
    "/api/superusers/auth-with-password",              // intermediate builds
  ];

  console.log("�🔐  Authenticating as admin...");

  for (const endpoint of endpoints) {
    process.stdout.write(`    Trying ${endpoint} ... `);
    const { ok, status, body } = await pbFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        identity: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (ok && body.token) {
      console.log("✅");
      console.log("✅  Authenticated\n");
      return body.token;
    }

    console.log(`❌  (${status}: ${body?.message})`);
  }

  console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌  Could not authenticate via any known endpoint.

Your PocketBase admin panel may be blocking API access.

👉  Try this instead — get your token from the browser:

  1. Open https://pb.palojori.in/_/ in your browser
  2. Log in with your admin credentials
  3. Open DevTools → Application → Local Storage → pb.palojori.in
  4. Copy the value of the key that starts with "pocketbase_auth"
     (it looks like: {"token":"eyJhbGci...","model":{...}})
  5. Copy just the token string (the part after "token":") 
  6. Run:

     POCKETBASE_ADMIN_TOKEN="eyJhbGci..." \\
     node scripts/setup-pocketbase.mjs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  process.exit(1);
}

async function getCollections(token) {
  const { body } = await pbFetch("/api/collections?perPage=200", {
    headers: { Authorization: token },
  });
  return body.items || [];
}

async function upsertCollection(token, schema) {
  const existing = await getCollections(token);
  const found = existing.find((c) => c.name === schema.name);

  const { listRule, viewRule, createRule, updateRule, deleteRule, ...rest } = schema;

  if (found) {
    console.log(`  ⚠️   "${schema.name}" already exists — updating rules...`);
    const { ok, body } = await pbFetch(`/api/collections/${found.id}`, {
      method: "PATCH",
      headers: { Authorization: token },
      body: JSON.stringify({ listRule, viewRule, createRule, updateRule, deleteRule }),
    });
    if (!ok) console.error(`     ❌  Error:`, body?.message);
    else console.log(`  ✅  "${schema.name}" rules updated`);
    return found.id;
  }

  // Step 1: create without rules (PocketBase v0.23+ validates rules against fields,
  // so fields must exist first — we create with null rules then patch them in)
  const { ok: createOk, body: createBody } = await pbFetch("/api/collections", {
    method: "POST",
    headers: { Authorization: token },
    body: JSON.stringify({ ...rest, listRule: null, viewRule: null, createRule: null, updateRule: null, deleteRule: null }),
  });

  if (!createOk) {
    console.error(`  ❌  Failed to create "${schema.name}":`, JSON.stringify(createBody, null, 2));
    process.exit(1);
  }
  console.log(`  ✅  "${schema.name}" created (id: ${createBody.id})`);

  // Step 2: patch in the rules now that fields exist
  const { ok: patchOk, body: patchBody } = await pbFetch(`/api/collections/${createBody.id}`, {
    method: "PATCH",
    headers: { Authorization: token },
    body: JSON.stringify({ listRule, viewRule, createRule, updateRule, deleteRule }),
  });
  if (!patchOk) {
    console.error(`  ⚠️   Rules patch failed:`, patchBody?.message);
  } else {
    console.log(`  ✅  "${schema.name}" rules applied`);
  }

  return createBody.id;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🌿  HabitFlow — PocketBase Setup`);
  console.log(`📡  Target: ${PB_URL}\n`);

  const token = await getAdminToken();

  // Verify token works
  const { ok: canList, body: listBody } = await pbFetch(
    "/api/collections?perPage=1",
    { headers: { Authorization: token } }
  );
  if (!canList) {
    console.error("❌  Token doesn't have admin access:", listBody?.message);
    console.error("    Make sure you copied the admin token, not a user token.");
    process.exit(1);
  }
  console.log("✅  Token verified — admin access confirmed\n");

  // ── 1. habits ──────────────────────────────────────────────────────────────
  console.log("📦  Creating collection: habits");
  await upsertCollection(token, {
    name: "habits",
    type: "base",
    schema: [
      {
        name: "user_id",
        type: "relation",
        required: true,
        options: {
          collectionId: "_pb_users_auth_",
          cascadeDelete: false,
          maxSelect: 1,
          minSelect: null,
          displayFields: null,
        },
      },
      { name: "name", type: "text", required: true, options: { min: 1, max: 200, pattern: "" } },
      { name: "type", type: "select", required: true, options: { maxSelect: 1, values: ["good", "bad"] } },
      { name: "category", type: "text", required: true, options: { min: null, max: 100, pattern: "" } },
      { name: "icon", type: "text", required: true, options: { min: null, max: 100, pattern: "" } },
      { name: "color", type: "text", required: true, options: { min: null, max: 20, pattern: "" } },
      { name: "frequency", type: "select", required: true, options: { maxSelect: 1, values: ["daily", "weekly"] } },
      { name: "target_per_day", type: "number", required: true, options: { min: 1, max: 100, noDecimal: true } },
      { name: "is_active", type: "bool", required: false, options: {} },
    ],
    listRule: "user_id = @request.auth.id",
    viewRule: "user_id = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "user_id = @request.auth.id",
    deleteRule: "user_id = @request.auth.id",
  });

  // ── 2. habit_logs ──────────────────────────────────────────────────────────
  console.log("\n📦  Creating collection: habit_logs");
  const allCollections = await getCollections(token);
  const habitsCol = allCollections.find((c) => c.name === "habits");
  if (!habitsCol) {
    console.error("❌  Could not find habits collection");
    process.exit(1);
  }

  await upsertCollection(token, {
    name: "habit_logs",
    type: "base",
    schema: [
      {
        name: "habit_id",
        type: "relation",
        required: true,
        options: {
          collectionId: habitsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
          minSelect: null,
          displayFields: null,
        },
      },
      { name: "date", type: "text", required: true, options: { min: 10, max: 10, pattern: "" } },
      { name: "status", type: "select", required: true, options: { maxSelect: 1, values: ["done", "missed"] } },
    ],
    listRule: "habit_id.user_id = @request.auth.id",
    viewRule: "habit_id.user_id = @request.auth.id",
    createRule: "@request.auth.id != '' && habit_id.user_id = @request.auth.id",
    updateRule: "habit_id.user_id = @request.auth.id",
    deleteRule: "habit_id.user_id = @request.auth.id",
  });

  // ── 3. journal_entries ─────────────────────────────────────────────────────
  console.log("\n📦  Creating collection: journal_entries");
  await upsertCollection(token, {
    name: "journal_entries",
    type: "base",
    schema: [
      {
        name: "user_id",
        type: "relation",
        required: true,
        options: {
          collectionId: "_pb_users_auth_",
          cascadeDelete: false,
          maxSelect: 1,
          minSelect: null,
          displayFields: null,
        },
      },
      { name: "date", type: "text", required: true, options: { min: 10, max: 10, pattern: "" } },
      { name: "good_text", type: "text", required: false, options: { min: null, max: 5000, pattern: "" } },
      { name: "bad_text", type: "text", required: false, options: { min: null, max: 5000, pattern: "" } },
      { name: "journal_text", type: "text", required: false, options: { min: null, max: 10000, pattern: "" } },
    ],
    listRule: "user_id = @request.auth.id",
    viewRule: "user_id = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "user_id = @request.auth.id",
    deleteRule: "user_id = @request.auth.id",
  });

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉  All 3 collections are ready!

   ✅  habits
   ✅  habit_logs
   ✅  journal_entries

Next step → start the app:
   npm run dev

Then open http://localhost:3000 and sign up!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
