"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/store/useStore";
import { loginSchema } from "@/lib/validations";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      const storeUser = useStore.getState().user;
      if (storeUser?.plan === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch {
      // Error handled in store
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-secondary-container/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <main className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-primary-glow">
              <span className="material-symbols-outlined icon-fill text-on-primary text-2xl">
                potted_plant
              </span>
            </div>
            <h1 className="font-headline font-black text-3xl tracking-tight text-primary">
              HabitFlow
            </h1>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 sm:p-10 flex flex-col gap-8 shadow-ambient">
          <div className="text-center space-y-2">
            <h2 className="font-headline font-bold text-2xl text-on-surface">
              Welcome Back
            </h2>
            <p className="font-body text-sm text-on-surface-variant">
              Enter your details to access your conservatory.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block font-label text-sm font-medium text-on-surface-variant"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/70 text-xl">
                    mail
                  </span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full bg-surface-container-highest border-b-2 border-primary/20 border-x-0 border-t-0 focus:border-primary focus:ring-0 rounded-t-DEFAULT pl-12 pr-4 py-4 font-body text-on-surface placeholder:text-outline-variant transition-colors outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block font-label text-sm font-medium text-on-surface-variant"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-primary/70 text-xl">
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
                  className="w-full bg-surface-container-highest border-b-2 border-primary/20 border-x-0 border-t-0 focus:border-primary focus:ring-0 rounded-t-DEFAULT pl-12 pr-12 py-4 font-body text-on-surface placeholder:text-outline-variant transition-colors outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="font-label text-xs font-medium text-secondary hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-on-primary font-label font-semibold text-base rounded-DEFAULT py-4 shadow-primary-glow hover:scale-[1.02] hover:bg-secondary-container hover:text-on-secondary-container transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="font-body text-sm text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-primary hover:text-secondary transition-colors underline decoration-primary/30 underline-offset-4"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="font-label text-xs text-outline/60">
            © 2024 HabitFlow Digital Conservatory
          </p>
        </div>
      </main>
    </div>
  );
}
