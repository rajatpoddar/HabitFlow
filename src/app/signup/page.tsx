"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import toast from "react-hot-toast";
import { signupSchema } from "@/lib/validations";

export default function SignupPage() {
  const router = useRouter();
  const signup = useStore((s) => s.signup);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setIsLoading(true);
    try {
      await signup(name, email, password);
      router.push("/dashboard");
    } catch {
      // Error handled in store
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "block w-full pl-12 pr-4 py-4 bg-transparent border-none text-on-surface focus:ring-0 font-body placeholder:text-on-surface-variant/50 outline-none";
  const wrapperClass =
    "relative bg-surface-container-highest rounded-t-DEFAULT border-b-2 border-primary/20 focus-within:border-primary transition-colors";

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <main className="w-full max-w-md">
        <div className="mb-12 text-center">
          <Link href="/">
            <h1 className="font-headline font-black text-4xl tracking-tight text-primary mb-2">
              HabitFlow
            </h1>
          </Link>
          <p className="font-body text-on-surface-variant text-lg">
            The Digital Conservatory
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 sm:p-10 shadow-ambient">
          <h2 className="font-headline font-bold text-2xl text-on-surface mb-8">
            Begin your journey
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-1">
              <label
                htmlFor="name"
                className="font-label text-sm font-medium text-on-surface-variant block ml-1"
              >
                Full Name
              </label>
              <div className={wrapperClass}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/60 text-xl">
                    person
                  </span>
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="font-label text-sm font-medium text-on-surface-variant block ml-1"
              >
                Email Address
              </label>
              <div className={wrapperClass}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/60 text-xl">
                    mail
                  </span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label
                htmlFor="password"
                className="font-label text-sm font-medium text-on-surface-variant block ml-1"
              >
                Password
              </label>
              <div className={wrapperClass}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/60 text-xl">
                    lock
                  </span>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label
                htmlFor="confirm_password"
                className="font-label text-sm font-medium text-on-surface-variant block ml-1"
              >
                Confirm Password
              </label>
              <div className={wrapperClass}>
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/60 text-xl">
                    lock
                  </span>
                </div>
                <input
                  id="confirm_password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-6 rounded-full font-headline font-bold text-base text-on-primary bg-gradient-to-r from-primary to-primary-container hover:scale-[1.02] hover:from-secondary hover:to-secondary-container hover:text-on-secondary-container transition-all duration-300 shadow-primary-glow disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                ) : (
                  "Sign Up"
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-on-surface-variant font-body">
              Already cultivating habits?{" "}
              <Link
                href="/login"
                className="font-medium text-primary hover:text-primary-container transition-colors ml-1"
              >
                Log in here.
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-on-surface-variant/60 font-label">
          © 2024 HabitFlow Digital Conservatory
        </div>
      </main>
    </div>
  );
}
