"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "potted_plant", label: "Forest" },
  { href: "/analytics", icon: "analytics", label: "Insights" },
  { href: "/journal", icon: "edit_note", label: "Journal" },
  { href: "/friends", icon: "group", label: "Friends" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-6 pt-2 pointer-events-none">
      <div className="w-full max-w-lg bg-surface/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,82,55,0.15)] border border-white/20 flex justify-between items-center p-1.5 pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2.5 rounded-[1.8rem] transition-all duration-300 ${
                isActive
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-on-surface-variant/40 hover:text-primary hover:bg-primary/5"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-all ${isActive ? "icon-fill" : ""}`}
              >
                {item.icon}
              </span>
              <span className={`font-label text-[9px] font-black uppercase tracking-[0.05em] mt-0.5 transition-all ${isActive ? "opacity-100" : "opacity-0 h-0"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
