/**
 * PocketBase Schema Setup Script
 * 
 * Run this after starting PocketBase to automatically create all collections.
 * Usage: node scripts/setup-pocketbase.js
 * 
 * Requires: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD env vars
 */

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090";
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error("Please set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD env vars");
  process.exit(1);
}

async function setup() {
  // Authenticate as admin
  const authRes = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!authRes.ok) {
    console.error("Failed to authenticate as admin");
    process.exit(1);
  }

  const { token } = await authRes.json();
  const headers = {
    "Content-Type": "application/json",
    Authorization: token,
  };

  console.log("✅ Authenticated as admin");

  // Create habits collection
  await createCollection(headers, {
    name: "habits",
    type: "base",
    schema: [
      { name: "user_id", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: false } },
      { name: "name", type: "text", required: true },
      { name: "type", type: "select", required: true, options: { values: ["good", "bad"] } },
      { name: "category", type: "text", required: true },
      { name: "icon", type: "text", required: true },
      { name: "color", type: "text", required: true },
      { name: "frequency", type: "select", required: true, options: { values: ["daily", "weekly"] } },
      { name: "target_per_day", type: "number", required: true, options: { min: 1 } },
      { name: "is_active", type: "bool", required: false },
    ],
    listRule: "user_id = @request.auth.id",
    viewRule: "user_id = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "user_id = @request.auth.id",
    deleteRule: "user_id = @request.auth.id",
  });

  console.log("✅ Created habits collection");

  // Create habit_logs collection
  await createCollection(headers, {
    name: "habit_logs",
    type: "base",
    schema: [
      { name: "habit_id", type: "relation", required: true, options: { collectionId: "habits", cascadeDelete: true } },
      { name: "date", type: "text", required: true },
      { name: "status", type: "select", required: true, options: { values: ["done", "missed"] } },
    ],
    listRule: "habit_id.user_id = @request.auth.id",
    viewRule: "habit_id.user_id = @request.auth.id",
    createRule: "@request.auth.id != '' && habit_id.user_id = @request.auth.id",
    updateRule: "habit_id.user_id = @request.auth.id",
    deleteRule: "habit_id.user_id = @request.auth.id",
  });

  console.log("✅ Created habit_logs collection");

  // Create journal_entries collection
  await createCollection(headers, {
    name: "journal_entries",
    type: "base",
    schema: [
      { name: "user_id", type: "relation", required: true, options: { collectionId: "_pb_users_auth_", cascadeDelete: false } },
      { name: "date", type: "text", required: true },
      { name: "good_text", type: "text", required: false, options: { max: 5000 } },
      { name: "bad_text", type: "text", required: false, options: { max: 5000 } },
      { name: "journal_text", type: "text", required: false, options: { max: 10000 } },
    ],
    listRule: "user_id = @request.auth.id",
    viewRule: "user_id = @request.auth.id",
    createRule: "@request.auth.id != ''",
    updateRule: "user_id = @request.auth.id",
    deleteRule: "user_id = @request.auth.id",
  });

  console.log("✅ Created journal_entries collection");
  console.log("\n🎉 PocketBase setup complete!");
}

async function createCollection(headers, data) {
  const res = await fetch(`${POCKETBASE_URL}/api/collections`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    if (err.code === 400 && err.message?.includes("already exists")) {
      console.log(`  ⚠️  Collection "${data.name}" already exists, skipping`);
      return;
    }
    console.error(`Failed to create collection "${data.name}":`, err);
  }
}

setup().catch(console.error);
