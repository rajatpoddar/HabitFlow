"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import TopBar from "@/components/ui/TopBar";
import BottomNav from "@/components/ui/BottomNav";

export default function UpgradePage() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopBar />

      <main className="flex-grow pb-24 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto w-full flex flex-col items-center justify-center text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary-container text-on-secondary-container mb-8 shadow-[0_40px_60px_-15px_rgba(0,82,55,0.12)]">
          <span className="material-symbols-outlined icon-fill text-5xl">eco</span>
        </div>

        {/* Badge */}
        <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full mb-6">
          Coming Soon
        </div>

        {/* Headline */}
        <h2 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-4 leading-tight">
          Forest Pro is <br />
          <span className="text-primary">on its way</span>
        </h2>

        <p className="font-body text-lg text-on-surface-variant max-w-md mb-10">
          We&apos;re putting the finishing touches on our Pro plan. Unlimited
          habits, advanced analytics, AI insights, and more — launching very
          soon.
        </p>

        {/* Feature preview */}
        <div className="w-full bg-surface-container-low rounded-[2rem] p-8 mb-8 text-left">
          <p className="font-headline text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-6">
            What&apos;s coming
          </p>
          <ul className="space-y-4">
            {[
              { icon: "stars", label: "Unlimited habits" },
              { icon: "analytics", label: "Advanced analytics & insights" },
              { icon: "palette", label: "Premium botanical themes" },
              { icon: "psychology", label: "AI-powered insights" },
              { icon: "notifications_active", label: "Smart reminders" },
              { icon: "backup", label: "Secure cloud backup" },
            ].map((f) => (
              <li key={f.label} className="flex items-center gap-3">
                <span className="material-symbols-outlined icon-fill text-primary text-xl">
                  {f.icon}
                </span>
                <span className="font-body text-on-surface font-medium">
                  {f.label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg shadow-[0_20px_40px_-10px_rgba(0,82,55,0.2)] transition-all hover:scale-[1.02] active:scale-95"
        >
          Back to Dashboard
        </button>
      </main>

      <BottomNav />
    </div>
  );
}
