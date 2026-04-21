"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent! Check your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <main className="w-full max-w-md">
        <div className="mb-12 text-center">
          <Link href="/">
            <h1 className="font-headline font-black text-4xl tracking-tight text-primary mb-2">
              HabitFlow
            </h1>
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-ambient">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-primary text-3xl">
                  mark_email_read
                </span>
              </div>
              <h2 className="font-headline font-bold text-2xl text-on-surface">
                Check your email
              </h2>
              <p className="font-body text-on-surface-variant text-sm">
                We sent a password reset link to{" "}
                <strong className="text-on-surface">{email}</strong>
              </p>
              <Link
                href="/login"
                className="block mt-4 font-label font-semibold text-primary hover:opacity-80 transition-opacity"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-headline font-bold text-2xl text-on-surface mb-2">
                Reset Password
              </h2>
              <p className="font-body text-sm text-on-surface-variant mb-8">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative bg-surface-container-highest rounded-t-DEFAULT border-b-2 border-primary/20 focus-within:border-primary transition-colors">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-primary/60 text-xl">
                      mail
                    </span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="block w-full pl-12 pr-4 py-4 bg-transparent border-none text-on-surface focus:ring-0 font-body outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary text-on-primary font-label font-semibold text-base rounded-full py-4 hover:scale-[1.02] transition-all disabled:opacity-60"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="font-body text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
