"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/store/useStore";

export default function UpgradeSuccessPage() {
  const router = useRouter();
  const { checkAuth } = useStore();

  // Re-fetch auth to get updated plan from DB
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary-container mx-auto shadow-[0_40px_60px_-15px_rgba(0,82,55,0.12)]">
          <span className="material-symbols-outlined icon-fill text-5xl text-on-secondary-container">
            eco
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-headline font-extrabold text-4xl text-on-surface">
            Welcome to Forest Pro!
          </h1>
          <p className="font-body text-lg text-on-surface-variant">
            Your growth journey just leveled up. Unlimited habits, advanced
            analytics, and AI insights are now unlocked.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="bg-surface-container-low rounded-[2rem] p-6 space-y-3 text-left">
          {[
            { icon: "stars", label: "Unlimited habits unlocked" },
            { icon: "analytics", label: "Advanced analytics enabled" },
            { icon: "psychology", label: "AI insights activated" },
            { icon: "palette", label: "Premium themes available" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="material-symbols-outlined icon-fill text-primary text-xl">
                {item.icon}
              </span>
              <span className="font-body text-on-surface text-sm font-medium">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="block w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg text-center shadow-[0_20px_40px_-10px_rgba(0,82,55,0.2)] hover:scale-[1.02] transition-all"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
