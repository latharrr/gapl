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
import { creditBalance } from "@/lib/plans";
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
  const credits = creditBalance(userDoc ?? {});

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-desk-line">
        <Link href="/" aria-label="Gapl home">
          <Wordmark size="sm" />
        </Link>
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className="p-2 rounded-[7px] hover:bg-desk-raised text-desk-muted hover:text-desk-ink">
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
                "flex items-center gap-3 h-10 px-3 rounded-[7px] text-sm font-medium transition-colors",
                active ? "bg-desk-raised text-desk-ink font-semibold" : "text-desk-muted hover:text-desk-ink hover:bg-desk-raised/60"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={17} className={active ? "text-highlight" : "text-desk-faint"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-3 border-t border-desk-line mt-auto">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-desk-raised text-desk-ink ring-1 ring-desk-line grid place-items-center text-sm font-semibold flex-shrink-0">
            {name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-desk-ink truncate">{name}</p>
            <p className="text-xs text-desk-muted truncate">{credits} credit{credits === 1 ? "" : "s"} left</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-[7px] text-desk-muted hover:text-desk-ink hover:bg-desk-raised"
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
      <aside className="on-desk hidden md:flex flex-col w-60 flex-shrink-0 border-r border-desk-line h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="on-desk md:hidden fixed top-0 inset-x-0 z-40 h-14 px-4 flex items-center gap-3 border-b border-desk-line">
        <button
          className="p-2 -ml-2 rounded-[7px] text-desk-ink hover:bg-desk-raised"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <Link href="/dashboard" aria-label="Gapl dashboard">
          <Wordmark size="sm" />
        </Link>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-desk/60 z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="on-desk fixed left-0 top-0 bottom-0 w-64 z-50 md:hidden border-r border-desk-line"
            >
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
