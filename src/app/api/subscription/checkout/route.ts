import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import Razorpay from "razorpay";

// Instantiated lazily inside the handler so missing env vars during
// Docker build-time static analysis don't throw at module load.
function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

// ₹499/month in paise (100 paise = ₹1)
const PLAN_AMOUNT = 49900;
const PLAN_CURRENCY = "INR";

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

    // Check if already pro
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("plan, razorpay_customer_id")
      .eq("id", user.id)
      .single();

    if (profile?.plan === "pro") {
      return NextResponse.json({ error: "Already on Pro plan" }, { status: 400 });
    }

    // Create a Razorpay subscription
    const planId = process.env.RAZORPAY_PLAN_ID!;

    const subscription = await getRazorpay().subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 billing cycles (1 year); set 0 for indefinite
      notes: {
        supabase_user_id: user.id,
        user_email: user.email ?? "",
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: PLAN_AMOUNT,
      currency: PLAN_CURRENCY,
      userName: profile ? undefined : user.email,
      userEmail: user.email,
    });
  } catch (error) {
    console.error("[Checkout Error]", error);
    return NextResponse.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}
