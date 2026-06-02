"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border-DEFAULT bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-[#111111] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">G</span>
              </div>
              <span className="text-sm font-semibold text-ink">Gapl</span>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              Application Readiness Engine for serious job seekers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              {[
                { label: "How it works", href: "/#how-it-works" },
                { label: "Features", href: "/#features" },
                { label: "Pricing", href: "/pricing" },
                { label: "Sample Report", href: "/demo" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-muted hover:text-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Legal</h4>
            <ul className="space-y-2">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Refund Policy", href: "/refund" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-muted hover:text-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold text-ink uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2">
              {[
                { label: "About", href: "/about" },
                { label: "Blog", href: "/blog" },
                { label: "Contact", href: "mailto:hello@gapl.in" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-muted hover:text-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border-DEFAULT flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} Gapl. All rights reserved.
          </p>
          <p className="text-xs text-ink-faint">
            Built for serious job seekers. Not for everyone.
          </p>
        </div>
      </div>
    </footer>
  );
}
