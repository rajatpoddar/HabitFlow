"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col overflow-x-hidden">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 bg-[#f1f4ef]/60 backdrop-blur-xl shadow-sm shadow-[rgba(0,82,55,0.05)]">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined icon-fill text-primary text-3xl">
              potted_plant
            </span>
            <span className="font-headline font-black text-2xl tracking-tight text-primary">
              HabitFlow
            </span>
          </div>
          <nav className="hidden md:flex gap-6 items-center">
            <a href="#features" className="font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#how-it-works" className="font-headline font-bold text-on-surface-variant hover:text-primary transition-colors">
              How it Works
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden md:block font-headline font-bold text-primary hover:opacity-80 transition-opacity"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="bg-primary text-on-primary font-headline font-bold px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-surface">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-surface-container-low to-transparent opacity-50 rounded-bl-[10rem]" />
            <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-gradient-to-tr from-surface-container to-transparent opacity-30 rounded-tr-[8rem]" />
          </div>
          <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full text-sm font-label text-on-surface-variant border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-sm">
                  psychiatry
                </span>
                <span>Cultivate your daily routine</span>
              </div>
              <h1 className="font-headline font-extrabold text-5xl md:text-7xl leading-tight text-on-surface tracking-tight">
                Build Better Habits,{" "}
                <br />
                <span className="text-primary relative inline-block">
                  Every Day.
                  <svg
                    className="absolute w-full h-3 -bottom-1 left-0 text-secondary-container opacity-50"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 10"
                  >
                    <path
                      d="M0 5 Q 50 10 100 5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                  </svg>
                </span>
              </h1>
              <p className="font-body text-xl text-on-surface-variant max-w-lg leading-relaxed">
                A digital sanctuary for personal growth. Track habits, analyze
                patterns, and nurture your potential without the noise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/signup"
                  className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-full font-headline font-bold text-lg hover:scale-105 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Start Your Journey{" "}
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  href="/login"
                  className="bg-surface-variant/40 text-on-surface px-8 py-4 rounded-full font-headline font-bold text-lg border border-outline-variant/20 hover:bg-surface-container hover:scale-105 transition-all duration-300 backdrop-blur-md flex items-center justify-center"
                >
                  Log In
                </Link>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="flex-1 w-full">
              <div className="relative w-full aspect-[4/3] rounded-[3rem] overflow-hidden bg-surface-container-low shadow-2xl shadow-primary/10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-surface-container" />
                <div className="relative z-10 flex flex-col items-center gap-6 p-8">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined icon-fill text-primary text-6xl">
                      forest
                    </span>
                  </div>
                  <div className="text-center">
                    <div className="font-headline font-black text-5xl text-primary">
                      68%
                    </div>
                    <div className="font-body text-on-surface-variant text-sm mt-1">
                      Today&apos;s Progress
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {["Morning Run", "Read 30min", "Meditate"].map((h) => (
                      <div
                        key={h}
                        className="bg-surface-container-lowest rounded-xl px-3 py-2 text-xs font-label font-medium text-on-surface flex items-center gap-1.5"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        {h}
                      </div>
                    ))}
                  </div>
                </div>
                {/* Floating streak card */}
                <div className="absolute bottom-6 left-6 right-6 bg-surface/80 backdrop-blur-2xl rounded-2xl p-4 border border-outline-variant/20 shadow-lg flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined icon-fill text-on-primary text-2xl">
                      local_fire_department
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-on-surface">
                      14 Day Streak
                    </h3>
                    <p className="font-body text-xs text-on-surface-variant">
                      Morning Meditation completed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section id="features" className="py-24 px-6 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="font-headline font-bold text-4xl text-on-surface">
                Cultivate with Intention
              </h2>
              <p className="font-body text-lg text-on-surface-variant">
                Everything you need to track, understand, and improve your daily
                routines in one mindful space.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="md:col-span-2 bg-surface-container-low rounded-[2rem] p-8 flex flex-col justify-between group hover:bg-surface-container transition-colors duration-500 overflow-hidden relative">
                <div className="z-10 relative space-y-4 max-w-md">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      checklist
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-2xl text-on-surface">
                    Daily Tracking
                  </h3>
                  <p className="font-body text-on-surface-variant leading-relaxed">
                    Log your habits seamlessly. Track both good habits and bad
                    habit avoidance with separate analytics.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 transform translate-y-1/4 translate-x-1/4 group-hover:scale-110 transition-transform duration-700">
                  <span className="material-symbols-outlined text-[200px] text-primary">
                    done_all
                  </span>
                </div>
              </div>
              {/* Feature 2 */}
              <div className="bg-secondary-container rounded-[2rem] p-8 flex flex-col justify-between group hover:shadow-xl hover:shadow-secondary/20 transition-all duration-500">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-on-secondary-container/10 flex items-center justify-center">
                    <span className="material-symbols-outlined icon-fill text-on-secondary-container text-2xl">
                      monitoring
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-2xl text-on-secondary-container">
                    Smart Analytics
                  </h3>
                  <p className="font-body text-on-secondary-container/80">
                    Uncover hidden patterns with beautiful charts, heatmaps, and
                    streak tracking.
                  </p>
                </div>
              </div>
              {/* Feature 3 */}
              <div className="bg-surface-container rounded-[2rem] p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface text-2xl">
                      local_fire_department
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-2xl text-on-surface">
                    Streak Tracking
                  </h3>
                  <p className="font-body text-on-surface-variant">
                    Build momentum. Visual cues keep you motivated to maintain
                    your progress day after day.
                  </p>
                </div>
              </div>
              {/* Feature 4 */}
              <div className="md:col-span-2 bg-surface rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8 border border-outline-variant/20 hover:border-primary/30 transition-colors duration-300">
                <div className="flex-1 space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary text-2xl">
                      edit_note
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-2xl text-on-surface">
                    Daily Journal
                  </h3>
                  <p className="font-body text-on-surface-variant leading-relaxed">
                    Reflect on your day with structured journaling. What went
                    well, what to improve, and your thoughts.
                  </p>
                </div>
                <div className="flex-1 w-full flex justify-center">
                  <div className="w-48 h-48 rounded-full bg-surface-container-high flex items-center justify-center shadow-inner relative">
                    <span className="material-symbols-outlined icon-fill text-[100px] text-primary z-10">
                      forest
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-secondary-container/20 to-transparent rounded-full animate-pulse-slow" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6 bg-surface-container-low">
          <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="font-headline font-bold text-4xl text-on-surface">
                Choose Your Growth Path
              </h2>
              <p className="font-body text-lg text-on-surface-variant">
                Start free and upgrade when you're ready to unlock your full potential.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="bg-surface-container rounded-[2rem] p-8 flex flex-col relative overflow-hidden border border-outline-variant/20">
                <div className="mb-6">
                  <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">
                    Seedling
                  </h3>
                  <p className="font-body text-on-surface-variant text-sm mb-4">
                    Perfect for getting started
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline text-5xl font-extrabold text-on-surface">
                      Free
                    </span>
                  </div>
                </div>
                <ul className="flex-grow space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check_circle
                    </span>
                    <span className="font-body text-on-surface text-sm">
                      Up to 5 daily habits
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check_circle
                    </span>
                    <span className="font-body text-on-surface text-sm">
                      Basic streak tracking
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check_circle
                    </span>
                    <span className="font-body text-on-surface text-sm">
                      Daily journal
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary text-xl">
                      check_circle
                    </span>
                    <span className="font-body text-on-surface text-sm">
                      Standard themes
                    </span>
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="w-full py-4 rounded-full bg-surface-variant/40 text-on-surface font-headline font-semibold text-center border border-outline-variant/20 hover:bg-surface-container-high transition-colors"
                >
                  Get Started Free
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="bg-surface-container-highest rounded-[2rem] p-8 flex flex-col relative overflow-hidden shadow-[0_40px_60px_-15px_rgba(0,82,55,0.1)] scale-100 md:scale-[1.05] border-2 border-primary/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full blur-2xl" />
                <div className="mb-6 relative z-10">
                  <div className="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest rounded-full mb-4">
                    Most Popular
                  </div>
                  <h3 className="font-headline text-2xl font-bold text-primary mb-2">
                    Forest Pro
                  </h3>
                  <p className="font-body text-on-surface-variant text-sm mb-4">
                    For dedicated cultivators
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline text-5xl font-extrabold text-on-surface">
                      ₹499
                    </span>
                    <span className="font-body text-on-surface-variant">/month</span>
                  </div>
                </div>
                <ul className="flex-grow space-y-3 mb-8 relative z-10">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined icon-fill text-primary text-xl">
                      stars
                    </span>
                    <span className="font-body text-on-surface font-medium">
                      Unlimited habits
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined icon-fill text-primary text-xl">
                      analytics
                    </span>
                    <span className="font-body text-on-surface font-medium">
                      Advanced analytics
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined icon-fill text-primary text-xl">
                      psychology
                    </span>
                    <span className="font-body text-on-surface font-medium">
                      AI-powered insights
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined icon-fill text-primary text-xl">
                      palette
                    </span>
                    <span className="font-body text-on-surface font-medium">
                      Premium themes
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined icon-fill text-primary text-xl">
                      backup
                    </span>
                    <span className="font-body text-on-surface font-medium">
                      Cloud backup
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined icon-fill text-primary text-xl">
                      notifications_active
                    </span>
                    <span className="font-body text-on-surface font-medium">
                      Smart reminders
                    </span>
                  </li>
                </ul>
                <Link
                  href="/signup"
                  className="w-full py-4 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-lg text-center shadow-[0_20px_40px_-10px_rgba(0,82,55,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_25px_50px_-12px_rgba(0,82,55,0.3)] active:scale-95 relative z-10"
                >
                  Start Pro — ₹499/mo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 px-6 bg-surface">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="text-center space-y-4">
              <h2 className="font-headline font-bold text-4xl text-on-surface">
                How It Works
              </h2>
              <p className="font-body text-lg text-on-surface-variant">
                Three simple steps to transform your daily routine.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: "add_circle",
                  title: "Plant Your Seeds",
                  desc: "Create habits — good ones to build, bad ones to break. Set your goals and frequency.",
                },
                {
                  step: "02",
                  icon: "check_circle",
                  title: "Nurture Daily",
                  desc: "Check off completed habits each day. For bad habits, mark your avoidance success.",
                },
                {
                  step: "03",
                  icon: "monitoring",
                  title: "Watch It Grow",
                  desc: "See your progress through analytics, streaks, and your growing digital forest.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-primary text-3xl">
                      {item.icon}
                    </span>
                  </div>
                  <div className="font-headline font-black text-4xl text-primary/20">
                    {item.step}
                  </div>
                  <h3 className="font-headline font-bold text-xl text-on-surface">
                    {item.title}
                  </h3>
                  <p className="font-body text-on-surface-variant">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 bg-surface relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#005237_0%,_transparent_60%)]" />
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10 bg-surface-container-low/50 backdrop-blur-xl p-12 rounded-[3rem] border border-outline-variant/30 shadow-2xl shadow-primary/5">
            <h2 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface">
              Ready to cultivate your best self?
            </h2>
            <p className="font-body text-xl text-on-surface-variant max-w-2xl mx-auto">
              Join thousands of others who have transformed their routines in
              our digital sanctuary.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <Link
                href="/signup"
                className="bg-primary text-on-primary px-10 py-4 rounded-full font-headline font-bold text-lg hover:scale-105 transition-all duration-300 shadow-md shadow-primary/20"
              >
                Start Free Today
              </Link>
              <Link
                href="/login"
                className="bg-transparent text-primary px-10 py-4 rounded-full font-headline font-bold text-lg border-2 border-primary hover:bg-primary/5 transition-all duration-300"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto gap-6 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-outline-variant/30 to-transparent" />
        <div className="font-headline font-bold text-primary text-xl tracking-tight">
          HabitFlow
        </div>
        <div className="font-body text-sm text-on-surface-variant">
          © 2024 HabitFlow Digital Conservatory
        </div>
        <div className="flex gap-6 font-body text-sm">
          {["Privacy", "Terms", "Support"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-on-surface-variant/60 hover:text-on-surface transition-colors"
            >
              {link}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
