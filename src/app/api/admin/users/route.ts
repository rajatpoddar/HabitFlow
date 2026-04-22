import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/api/admin";
import { checkAdminRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = await checkAdminRateLimit(`admin-users:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // Verify caller is admin via session client
  const sessionClient = createSupabaseServerClient();
  const admin = await requireAdmin(sessionClient);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Use service-role client for data queries — bypasses RLS
  const supabase = createSupabaseAdminClient();

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const plan = searchParams.get("plan") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("admin_users_view")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
  }
  if (plan) {
    query = query.eq("plan", plan);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    users: data,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
