"use client";

import Link from "next/link";

export default function UpgradeCancelPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-surface-container mx-auto">
          <span className="material-symbols-outlined text-5xl text-on-surface-variant">
            sentiment_neutral
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-headline font-extrabold text-4xl text-on-surface">
            No worries!
          </h1>
          <p className="font-body text-lg text-on-surface-variant">
            You can upgrade to Forest Pro anytime. Your free plan is still
            active.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/upgrade"
            className="block w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg text-center hover:scale-[1.02] transition-all"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="block w-full py-4 rounded-full bg-surface-container text-on-surface font-headline font-semibold text-lg text-center hover:bg-surface-container-high transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
