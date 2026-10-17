"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { LoadingChart } from "@/components/ui/Sheet";
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
  ExternalLink,
  Sparkles,
  Menu,
  X,
  Mail,
  Link as LinkIcon,
  HeartPulse,
  BellRing,
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Reports", href: "/admin/reports", icon: FileText },
  { label: "AI Calls", href: "/admin/ai-calls", icon: Cpu },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Emails Control", href: "/admin/emails", icon: Mail },
  { label: "Trackable Links", href: "/admin/links", icon: LinkIcon },
  { label: "Email Health", href: "/admin/email-health", icon: HeartPulse },
  { label: "Email Insights", href: "/admin/email-insights", icon: Sparkles },
  { label: "Founder Alerts", href: "/admin/alerts", icon: BellRing },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Audit Logs", href: "/admin/audit", icon: History },
  { label: "System Health", href: "/admin/health", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Auto redirect unauthenticated users to login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-muted grid place-items-center">
        <LoadingChart text="LOADING CONTROL ROOM" />
      </div>
    );
  }

  if (!user) return null;

  const currentRole = (userDoc?.role as string) || "user";
  const isAdmin = ["super_admin", "admin", "support", "readonly"].includes(currentRole);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface-muted grid place-items-center p-4">
        <div className="chart-sheet rounded-[6px] overflow-hidden max-w-md w-full">
          <div className="led-board px-4 py-2.5 text-[1rem]">ACCESS DENIED</div>
          <div className="p-6 space-y-3">
            <h1 className="text-xl font-[800] tracking-[-0.015em]">This area is for the Gapl team</h1>
            <p className="text-[0.9375rem] text-ink-secondary">
              Your account (<strong className="text-ink">{user.email}</strong>) doesn&apos;t have admin access.
            </p>
            <Link href="/dashboard" className="inline-block text-sm font-semibold text-primary-600 underline hover:text-primary-700">
              Back to your dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const nav = (
    <>
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/15">
        <Link href="/admin" className="flex items-center gap-2.5" aria-label="Gapl admin home">
          <Wordmark size="sm" />
          <span className="chart-data text-[0.6875rem] font-bold uppercase text-board">Control room</span>
        </Link>
        <button
          className="md:hidden p-1.5 rounded-[4px] text-primary-100 hover:bg-white/10"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 h-9 px-3 rounded-[4px] text-sm transition-colors ${
                isActive ? "bg-white/12 text-white font-semibold" : "text-primary-100 hover:text-white hover:bg-white/8"
              }`}
            >
              <Icon size={16} className={isActive ? "text-board" : "text-primary-400"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/15">
        <Link
          href="/dashboard"
          className="flex items-center justify-between h-9 px-3 rounded-[4px] text-sm text-primary-100 hover:text-white hover:bg-white/8"
        >
          <span>User dashboard</span>
          <ExternalLink size={14} />
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-muted text-ink flex">
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-primary-600 border-r-[3px] border-board h-screen sticky top-0">
        {nav}
      </aside>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-primary-900/50 md:hidden" onClick={() => setMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-primary-600 border-r-[3px] border-board md:hidden">
            {nav}
          </aside>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden h-14 px-4 flex items-center gap-3 bg-primary-600 border-b-[3px] border-board">
          <button onClick={() => setMenuOpen(true)} aria-label="Open menu" className="p-1.5 -ml-1.5 rounded-[4px] text-white hover:bg-white/10">
            <Menu size={20} />
          </button>
          <Wordmark size="sm" />
          <span className="chart-data text-[0.6875rem] font-bold uppercase text-board">Control room</span>
        </header>
        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
