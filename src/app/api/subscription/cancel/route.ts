import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Razorpay from "razorpay";

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("stripe_subscription_id, plan")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_subscription_id || profile.plan !== "pro") {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Cancel at end of current billing cycle (cancel_at_cycle_end = 1)
    await getRazorpay().subscriptions.cancel(profile.stripe_subscription_id, true);

    await supabase
      .from("user_profiles")
      .update({
        subscription_status: "cancel_at_period_end",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cancel Subscription Error]", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
