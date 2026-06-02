"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { logOut } from "@/lib/firebase";
import {
  LayoutDashboard,
  FileText,
  TrendingUp,
  Map,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
  ChevronDown,
  Wand2,
  FileCheck2,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/dashboard",           icon: LayoutDashboard },
  { label: "Reports",    href: "/dashboard/reports",    icon: FileText },
  { label: "My CVs",     href: "/dashboard/my-cvs",     icon: FileCheck2 },
  { label: "Progress",   href: "/dashboard/progress",   icon: TrendingUp },
  { label: "Roadmaps",   href: "/dashboard/roadmaps",   icon: Map },
  { label: "CV Builder", href: "/cv-builder",           icon: Wand2 },
  { label: "Billing",    href: "/dashboard/billing",    icon: CreditCard },
  { label: "Settings",   href: "/dashboard/settings",   icon: Settings },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userDoc } = useAuth();

  const handleLogout = async () => {
    await logOut();
    router.push("/");
  };

  const name = user?.displayName || "User";
  const email = user?.email || "";
  const plan = (userDoc?.plan as string) || "free";

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-border-DEFAULT">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#111111] rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          <span className="text-sm font-semibold text-ink">Gapl</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md hover:bg-surface-subtle text-ink-muted">
            <X size={16} />
          </button>
        )}
      </div>

      {/* New analysis CTA */}
      <div className="px-3 pt-4 pb-2">
        <Link href="/analyze">
          <button className="w-full h-8 flex items-center gap-2 px-3 rounded-lg bg-[#111111] text-white text-xs font-medium hover:bg-zinc-800 transition-colors">
            <Plus size={14} />
            New Analysis
          </button>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 h-8 px-3 rounded-lg text-xs font-medium transition-all duration-150",
                active
                  ? "bg-surface-subtle text-ink"
                  : "text-ink-muted hover:text-ink hover:bg-surface-subtle"
              )}
            >
              <Icon size={14} className={active ? "text-ink" : "text-ink-muted"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-2 border-t border-border-DEFAULT mt-auto">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer group">
          <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-ink truncate">{name}</p>
            <p className="text-2xs text-ink-faint truncate capitalize">{plan} plan</p>
          </div>
          <button
            onClick={handleLogout}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-border-DEFAULT text-ink-faint hover:text-ink transition-all"
            title="Sign out"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-border-DEFAULT bg-white h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-white rounded-lg border border-border-DEFAULT shadow-sm"
        onClick={() => setMobileOpen(true)}
      >
        <Menu size={16} className="text-ink" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed left-0 top-0 bottom-0 w-56 bg-white z-50 md:hidden border-r border-border-DEFAULT"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
