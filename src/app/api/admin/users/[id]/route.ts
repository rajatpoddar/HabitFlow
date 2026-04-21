import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/api/admin";
import { banUserSchema, updateUserPlanSchema } from "@/lib/validations";
import { rateLimit, ADMIN_RATE_LIMIT, getClientIp } from "@/lib/rate-limit";

// PATCH /api/admin/users/[id] — ban, unban, or change plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const rl = rateLimit(`admin-patch:${ip}`, ADMIN_RATE_LIMIT);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const sessionClient = createSupabaseServerClient();
  const admin = await requireAdmin(sessionClient);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === admin.id) {
    return NextResponse.json({ error: "Cannot modify your own account" }, { status: 400 });
  }

  // Use service-role for writes
  const supabase = createSupabaseAdminClient();

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const action = (body as any)?.action;

  if (action === "ban") {
    const parsed = banUserSchema.safeParse({ userId: params.id, reason: (body as any).reason });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_banned: true, ban_reason: parsed.data.reason })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "ban_user",
      target_type: "user",
      target_id: params.id,
      metadata: { reason: parsed.data.reason },
    });

    return NextResponse.json({ success: true });
  }

  if (action === "unban") {
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_banned: false, ban_reason: null })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "unban_user",
      target_type: "user",
      target_id: params.id,
    });

    return NextResponse.json({ success: true });
  }

  if (action === "update_plan") {
    const parsed = updateUserPlanSchema.safeParse({ userId: params.id, plan: (body as any).plan });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
    }
    const { error } = await supabase
      .from("user_profiles")
      .update({ plan: parsed.data.plan })
      .eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("audit_log").insert({
      actor_id: admin.id,
      action: "update_plan",
      target_type: "user",
      target_id: params.id,
      metadata: { plan: parsed.data.plan },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// DELETE /api/admin/users/[id] — delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const rl = rateLimit(`admin-delete:${ip}`, ADMIN_RATE_LIMIT);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const sessionClient = createSupabaseServerClient();
  const admin = await requireAdmin(sessionClient);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === admin.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase
    .from("user_profiles")
    .update({ is_banned: true, ban_reason: "Account deleted by admin" })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("audit_log").insert({
    actor_id: admin.id,
    action: "delete_user",
    target_type: "user",
    target_id: params.id,
  });

  return NextResponse.json({ success: true });
}
