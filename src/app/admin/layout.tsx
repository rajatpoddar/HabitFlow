import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HabitFlow Admin",
  description: "Admin dashboard for HabitFlow",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f1117] text-white font-body">
      {children}
    </div>
  );
}
