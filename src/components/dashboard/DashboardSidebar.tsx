"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";
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
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/15">
        <Link href="/" aria-label="Gapl home">
          <Wordmark size="sm" />
        </Link>
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className="p-1.5 rounded-[4px] hover:bg-white/10 text-primary-100">
            <X size={16} />
          </button>
        )}
      </div>

      {/* New analysis CTA */}
      <div className="px-3 pt-4 pb-2">
        <Link href="/analyze" onClick={onClose}>
          <Button size="md" className="w-full justify-start">
            <Plus size={16} strokeWidth={2.5} />
            New analysis
          </Button>
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
                "flex items-center gap-3 h-10 px-3 rounded-[4px] text-sm font-medium transition-colors",
                active ? "bg-white/12 text-white font-semibold" : "text-primary-100 hover:text-white hover:bg-white/8"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={17} className={active ? "text-board" : "text-primary-400"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-3 border-t border-white/15 mt-auto">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-[4px] bg-board text-board-ink grid place-items-center text-sm font-[800] flex-shrink-0">
            {name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="chart-data text-[0.6875rem] text-primary-100 truncate uppercase">{plan} plan</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-[4px] text-primary-100 hover:text-white hover:bg-white/10"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
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
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-primary-600 border-r-[3px] border-board h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-primary-600 rounded-[5px] shadow-md"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={18} className="text-white" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-primary-900/50 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-primary-600 z-50 md:hidden border-r-[3px] border-board"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
