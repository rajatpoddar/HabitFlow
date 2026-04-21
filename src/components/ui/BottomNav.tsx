"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "potted_plant", label: "Forest" },
  { href: "/analytics", icon: "analytics", label: "Insights" },
  { href: "/journal", icon: "edit_note", label: "Journal" },
  { href: "/settings", icon: "settings", label: "Settings" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50 flex justify-around items-center p-3 mb-4 bg-[#f1f4ef]/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_40px_60px_-15px_rgba(0,82,55,0.10)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-full transition-all duration-200 ${
              isActive
                ? "bg-[#ecefea] text-[#005237] scale-105"
                : "text-[#3f4943]/50 hover:text-[#005237] hover:bg-[#ecefea]/50"
            }`}
          >
            <span
              className="material-symbols-outlined text-xl mb-0.5"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="font-label text-[10px] font-semibold uppercase tracking-wider">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
