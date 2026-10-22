"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/brand/Wordmark";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "How it reads", href: "/#how-it-reads" },
  { label: "Sample report", href: "/demo" },
  { label: "Pricing", href: "/pricing" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Close mobile menu on route change — adjust state during render, no effect.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  // Lock page scroll while the mobile menu covers it.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  // Sign-in from a content page comes back to it; from home it goes to the dashboard.
  const loginHref = pathname && pathname !== "/" && !pathname.startsWith("/auth")
    ? `/auth/login?next=${encodeURIComponent(pathname)}`
    : "/auth/login";

  return (
    <>
      <header className="on-desk fixed top-0 left-0 right-0 z-50 border-b border-desk-line">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
          <Link href={user ? "/dashboard" : "/"} aria-label="Gapl home" className="shrink-0">
            <Wordmark />
          </Link>

          <div className="hidden md:flex items-center gap-1 mr-auto">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-[7px] transition-colors",
                    active ? "text-desk-ink" : "text-desk-muted hover:text-desk-ink hover:bg-desk-raised"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-28 h-9 bg-desk-raised animate-pulse rounded-[7px]" />
            ) : user ? (
              <Link href="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link
                  href={loginHref}
                  className="px-3 py-2 text-sm font-medium text-desk-muted hover:text-desk-ink rounded-[7px] hover:bg-desk-raised transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/analyze">
                  <Button size="sm">Check my resume</Button>
                </Link>
              </>
            )}
          </div>

          {/* Phones keep the one action in reach above the fold */}
          {!loading && (
            <Link href={user ? "/dashboard" : "/analyze"} className="md:hidden ml-auto">
              <Button size="sm">{user ? "Dashboard" : "Read my resume"}</Button>
            </Link>
          )}

          <button
            className="md:hidden -mr-2 w-11 h-11 inline-flex items-center justify-center rounded-[8px] text-desk-ink hover:bg-desk-raised"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="on-desk fixed top-16 left-0 right-0 bottom-0 z-40 md:hidden"
          >
            <div className="px-4 pt-2 pb-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-4 text-lg font-medium text-desk-ink border-b border-desk-line"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-6 flex flex-col gap-2">
                {loading ? (
                  <div className="h-12 bg-desk-raised animate-pulse rounded-[9px]" />
                ) : user ? (
                  <Link href="/dashboard" className="w-full">
                    <Button size="lg" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/analyze" className="w-full">
                      <Button size="lg" className="w-full">Check my resume</Button>
                    </Link>
                    <Link href={loginHref} className="w-full">
                      <Button variant="desk" size="lg" className="w-full">Sign in</Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
