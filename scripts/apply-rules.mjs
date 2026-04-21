/**
 * Applies API security rules to the 3 HabitFlow collections.
 * Run after setup-pocketbase.mjs:
 *
 *   POCKETBASE_ADMIN_EMAIL=you@email.com \
 *   POCKETBASE_ADMIN_PASSWORD=yourpassword \
 *   node scripts/apply-rules.mjs
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

async function main() {
  console.log("\n🔐  Authenticating...");
  const { ok, body: auth } = await pbFetch(
    "/api/collections/_superusers/auth-with-password",
    {
      method: "POST",
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    }
  );
  if (!ok || !auth.token) {
    console.error("❌  Auth failed:", auth?.message);
    process.exit(1);
  }
  const token = auth.token;
  console.log("✅  Authenticated\n");

  const rules = [
    {
      name: "habits",
      listRule: "user_id = @request.auth.id",
      viewRule: "user_id = @request.auth.id",
      createRule: '@request.auth.id != ""',
      updateRule: "user_id = @request.auth.id",
      deleteRule: "user_id = @request.auth.id",
    },
    {
      name: "habit_logs",
      listRule: "habit_id.user_id = @request.auth.id",
      viewRule: "habit_id.user_id = @request.auth.id",
      createRule: '@request.auth.id != ""',
      updateRule: "habit_id.user_id = @request.auth.id",
      deleteRule: "habit_id.user_id = @request.auth.id",
    },
    {
      name: "journal_entries",
      listRule: "user_id = @request.auth.id",
      viewRule: "user_id = @request.auth.id",
      createRule: '@request.auth.id != ""',
      updateRule: "user_id = @request.auth.id",
      deleteRule: "user_id = @request.auth.id",
    },
  ];

  for (const rule of rules) {
    const { name, ...ruleFields } = rule;
    process.stdout.write(`🔒  Applying rules to "${name}" ... `);

    // Get collection ID
    const { ok: getOk, body: col } = await pbFetch(`/api/collections/${name}`, {
      headers: { Authorization: token },
    });
    if (!getOk) {
      console.log(`❌  Not found (${col?.message})`);
      continue;
    }

    // Patch rules
    const { ok: patchOk, body: patched } = await pbFetch(
      `/api/collections/${col.id}`,
      {
        method: "PATCH",
        headers: { Authorization: token },
        body: JSON.stringify(ruleFields),
      }
    );

    if (patchOk) {
      console.log("✅");
    } else {
      console.log(`❌  ${patched?.message}`);
      // Show detailed errors if any
      if (patched?.data) {
        for (const [field, err] of Object.entries(patched.data)) {
          console.log(`     ${field}: ${err.message}`);
        }
      }
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Rules applied! Your backend is ready.

Run the app:
   npm run dev
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch(console.error);
