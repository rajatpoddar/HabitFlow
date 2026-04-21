import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Use service-role client for webhook (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.error("Razorpay webhook signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload: any };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.event) {
      // Subscription activated / charged successfully
      case "subscription.activated":
      case "subscription.charged": {
        const sub = event.payload?.subscription?.entity;
        const userId = sub?.notes?.supabase_user_id;
        if (!userId) break;

        await supabaseAdmin
          .from("user_profiles")
          .update({
            plan: "pro",
            stripe_subscription_id: sub.id,
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        break;
      }

      // Subscription cancelled or completed
      case "subscription.cancelled":
      case "subscription.completed": {
        const sub = event.payload?.subscription?.entity;
        const userId = sub?.notes?.supabase_user_id;
        if (!userId) break;

        await supabaseAdmin
          .from("user_profiles")
          .update({
            plan: "free",
            stripe_subscription_id: null,
            subscription_status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        break;
      }

      // Payment failed
      case "subscription.halted":
      case "payment.failed": {
        const sub =
          event.payload?.subscription?.entity ??
          event.payload?.payment?.entity;
        const userId = sub?.notes?.supabase_user_id;
        if (!userId) break;

        await supabaseAdmin
          .from("user_profiles")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);
        break;
      }

      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error("Error processing Razorpay webhook:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
