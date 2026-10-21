"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/brand/Wordmark";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary-600 text-primary-foreground border-b-[3px] border-board">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
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
                  className={`px-3 py-1.5 text-sm font-medium rounded-[4px] transition-colors ${
                    active ? "text-board" : "text-primary-100 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-24 h-8 bg-white/10 animate-pulse rounded-[4px]" />
            ) : user ? (
              <Link href="/dashboard">
                <Button variant="primary" size="sm">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href={loginHref}
                  className="px-3 py-1.5 text-sm font-medium text-primary-100 hover:text-white rounded-[4px] hover:bg-white/10 transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/analyze">
                  <Button variant="primary" size="sm">
                    Check my status
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden -mr-2 w-11 h-11 inline-flex items-center justify-center rounded-[4px] text-primary-100 hover:bg-white/10"
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
            className="fixed top-[59px] left-0 right-0 z-40 bg-primary-600 text-primary-foreground shadow-lg md:hidden"
          >
            <div className="px-4 pt-2 pb-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block py-3 text-base font-medium text-primary-100 border-b border-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 flex flex-col gap-2">
                {loading ? (
                  <div className="h-12 bg-white/10 animate-pulse rounded-[6px]" />
                ) : user ? (
                  <Link href="/dashboard" className="w-full">
                    <Button variant="primary" size="lg" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/analyze" className="w-full">
                      <Button variant="primary" size="lg" className="w-full">
                        Check my status
                      </Button>
                    </Link>
                    <Link
                      href={loginHref}
                      className="w-full h-12 inline-flex items-center justify-center text-sm font-semibold text-primary-100 border-[1.5px] border-white/25 rounded-[6px]"
                    >
                      Sign in
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
