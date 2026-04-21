import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
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

  // For Razorpay, redirect to dashboard where users can manage subscriptions
  // Razorpay doesn't have a hosted customer portal like Stripe
  // You can implement custom subscription management UI or redirect to Razorpay dashboard
  
  return NextResponse.json({
    message: "Manage your subscription in Settings",
    redirectUrl: "/settings",
  });
}
