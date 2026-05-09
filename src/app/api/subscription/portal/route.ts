import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile] = await db
    .select({ stripeSubscriptionId: users.stripeSubscriptionId, plan: users.plan })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!profile?.stripeSubscriptionId || profile.plan !== "pro") {
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
