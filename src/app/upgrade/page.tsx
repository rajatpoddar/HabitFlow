"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import TopBar from "@/components/ui/TopBar";
import BottomNav from "@/components/ui/BottomNav";
import toast from "react-hot-toast";

// Razorpay checkout widget is loaded via script tag
declare global {
  interface Window {
    Razorpay: any;
  }
}

function useRazorpayScript() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (window.Razorpay) { setLoaded(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);
  return loaded;
}

export default function UpgradePage() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useStore();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const scriptLoaded = useRazorpayScript();

  useEffect(() => { checkAuth(); }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  const handleUpgrade = async () => {
    if (!user || !scriptLoaded) return;
    setIsUpgrading(true);

    try {
      // 1. Create Razorpay subscription on server
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create subscription");
      }

      const { subscriptionId, keyId, userEmail } = await res.json();

      // 2. Open Razorpay checkout widget
      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "HabitFlow",
        description: "Forest Pro — Monthly Subscription",
        image: "/icon-192.png",
        prefill: {
          email: userEmail ?? user.email,
        },
        theme: { color: "#005237" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) => {
          // 3. Verify payment on server and activate pro
          const verifyRes = await fetch("/api/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          if (!verifyRes.ok) {
            const err = await verifyRes.json();
            toast.error(err.error || "Payment verification failed");
            setIsUpgrading(false);
            return;
          }

          // Re-fetch auth to get updated plan
          await checkAuth();
          router.push("/upgrade/success");
        },
        modal: {
          ondismiss: () => setIsUpgrading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response: any) => {
        toast.error(response.error?.description || "Payment failed");
        setIsUpgrading(false);
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to start upgrade");
      setIsUpgrading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  if (user.plan === "pro" || user.plan === "admin") {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopBar />

      <main className="flex-grow pb-24 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto w-full flex flex-col items-center">
        {/* Hero */}
        <section className="text-center mt-8 mb-16 w-full max-w-2xl">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary-container text-on-secondary-container mb-6 shadow-[0_40px_60px_-15px_rgba(0,82,55,0.08)]">
            <span className="material-symbols-outlined icon-fill text-4xl">eco</span>
          </div>
          <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4 leading-tight">
            Unlock your full <br />
            <span className="text-primary">growth potential</span>
          </h2>
          <p className="font-body text-lg text-on-surface-variant max-w-lg mx-auto">
            Nurture your habits into a flourishing ecosystem. Get advanced
            insights, unlimited tracking, and a deeper connection to your
            progress.
          </p>
        </section>

        {/* Pricing Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Free Plan */}
          <div className="bg-surface-container-low rounded-[2rem] p-8 flex flex-col h-full relative overflow-hidden group hover:bg-surface-container transition-colors">
            <div className="absolute inset-0 border border-outline-variant/15 rounded-[2rem] pointer-events-none" />
            <div className="mb-8">
              <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">
                Seedling
              </h3>
              <p className="font-body text-on-surface-variant text-sm">
                For starting your journey
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-headline text-4xl font-extrabold text-on-surface">
                  Free
                </span>
              </div>
            </div>
            <ul className="flex-grow space-y-4 mb-8">
              {[
                "Up to 5 daily habits",
                "Basic streak tracking",
                "Standard nature themes",
                "Daily journal",
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">
                    check_circle
                  </span>
                  <span className="font-body text-on-surface text-sm">{f}</span>
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full py-4 rounded-full bg-surface-variant/40 text-on-surface-variant font-body font-medium border border-outline-variant/10 cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-surface-container-highest rounded-[2rem] p-8 flex flex-col h-full relative overflow-hidden shadow-[0_40px_60px_-15px_rgba(0,82,55,0.06)] scale-100 md:scale-[1.05] z-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full blur-2xl" />
            <div className="mb-8 relative z-10">
              <div className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest rounded-full mb-4">
                Most Popular
              </div>
              <h3 className="font-headline text-2xl font-bold text-primary mb-2">
                Forest Pro
              </h3>
              <p className="font-body text-on-surface-variant text-sm">
                For the dedicated cultivator
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-headline text-5xl font-extrabold text-on-surface">
                  ₹499
                </span>
                <span className="font-body text-on-surface-variant">/mo</span>
              </div>
            </div>
            <ul className="flex-grow space-y-4 mb-8 relative z-10">
              {[
                { icon: "stars", label: "Unlimited habits" },
                { icon: "analytics", label: "Advanced analytics & insights" },
                { icon: "palette", label: "Premium botanical themes" },
                { icon: "backup", label: "Secure cloud backup" },
                { icon: "psychology", label: "AI-powered insights" },
                { icon: "notifications_active", label: "Smart reminders" },
              ].map((f) => (
                <li key={f.label} className="flex items-start gap-3">
                  <span className="material-symbols-outlined icon-fill text-primary text-xl">
                    {f.icon}
                  </span>
                  <span className="font-body text-on-surface font-medium">
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading || !scriptLoaded}
              className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg shadow-[0_20px_40px_-10px_rgba(0,82,55,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_25px_50px_-12px_rgba(0,82,55,0.3)] active:scale-95 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpgrading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Opening payment...
                </span>
              ) : (
                "Upgrade Now — ₹499/mo"
              )}
            </button>
          </div>
        </section>

        {/* Trust footer */}
        <p className="mt-12 text-center text-on-surface-variant text-sm font-body max-w-md">
          Cancel anytime. Secure payment via{" "}
          <span className="font-semibold text-on-surface">Razorpay</span>. UPI,
          cards, net banking & wallets accepted. By upgrading, you agree to our{" "}
          <a className="underline text-primary hover:text-primary-container" href="#">
            Terms of Service
          </a>
          .
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
