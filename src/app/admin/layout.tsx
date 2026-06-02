"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  LayoutDashboard,
  Users,
  FileText,
  Cpu,
  CreditCard,
  BarChart3,
  Activity,
  History,
  Settings,
  Shield,
  Loader2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "AI Calls", href: "/admin/ai-calls", icon: Cpu },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Audit Logs", href: "/admin/audit", icon: History },
  { label: "System Health", href: "/admin/health", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Auto redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6366f1]" />
      </div>
    );
  }

  if (!user) return null;

  const currentRole = (userDoc?.role as string) || "user";
  const isAdmin = ["super_admin", "admin", "support", "readonly"].includes(currentRole);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-[#27272a] bg-[#18181b] rounded-2xl p-8 text-center space-y-6">
          <div className="w-12 h-12 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center justify-center mx-auto text-red-500">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white mb-2">Access Denied</h1>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Your account (<strong>{user.email}</strong>) does not have administrative privileges required to access the Gapl Control Center.
            </p>
          </div>

          <div className="pt-4 border-t border-[#27272a]">
            <Link href="/dashboard" className="block text-xs text-[#a1a1aa] hover:text-white transition-colors">
              Return to User Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col font-sans">

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r border-[#1f1f23] bg-[#09090b] flex flex-col justify-between flex-shrink-0">
          <div className="p-5 space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#6366f1] rounded-md flex items-center justify-center shadow-lg shadow-[#6366f1]/30">
                <Shield size={13} className="text-white" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-white">Gapl</span>
                <span className="text-[10px] text-[#71717a] ml-1.5 uppercase tracking-wider font-semibold">Admin</span>
              </div>
            </div>

            {/* Menu */}
            <nav className="space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-[#18181b] text-white border border-[#27272a]"
                        : "text-[#a1a1aa] hover:text-white hover:bg-[#18181b]/50 border border-transparent"
                    }`}
                  >
                    <Icon size={14} className={isActive ? "text-[#6366f1]" : "text-[#71717a]"} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#1f1f23] space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs text-[#71717a] hover:text-white transition-colors"
            >
              <span>User Dashboard</span>
              <ExternalLink size={10} />
            </Link>
          </div>
        </aside>

        {/* Content body */}
        <main className="flex-1 overflow-y-auto bg-[#09090b] p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
