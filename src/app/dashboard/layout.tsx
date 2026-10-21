"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname || "/dashboard")}`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="led-board h-11 px-4 flex items-center rounded-[4px] text-[1.05rem]">
            <span className="animate-led-blink">LOADING WORKSPACE</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex h-screen bg-surface-muted overflow-hidden">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
