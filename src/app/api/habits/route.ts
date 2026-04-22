import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { createHabitSchema } from "@/lib/validations";
import { checkApiRateLimit, getClientIp } from "@/lib/rate-limit";

const FREE_HABIT_LIMIT = 5;

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ habits: data });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = await checkApiRateLimit(`habits:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const supabase = createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check plan limits
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan = profile?.plan ?? "free";

  if (plan === "free") {
    const { count } = await supabase
      .from("habits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if ((count ?? 0) >= FREE_HABIT_LIMIT) {
      return NextResponse.json(
        {
          error: `Free plan is limited to ${FREE_HABIT_LIMIT} habits. Upgrade to Pro for unlimited habits.`,
          code: "PLAN_LIMIT_EXCEEDED",
        },
        { status: 403 }
      );
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = createHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 422 }
    );
  }

  const { data, error } = await supabase
    .from("habits")
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ habit: data }, { status: 201 });
}
