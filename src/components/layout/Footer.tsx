import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How it reads", href: "/#how-it-reads" },
      { label: "Sample report", href: "/demo" },
      { label: "Pricing", href: "/pricing" },
      { label: "Check my resume", href: "/analyze" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "hello@gapl.in", href: "mailto:hello@gapl.in" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="on-desk border-t border-desk-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-8 gap-y-10">
          <div className="col-span-2 md:col-span-1 max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-desk-muted">
              Your resume, read the way a recruiter reads it. The verdict, the reason, and what to build next.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold text-desk-ink mb-3">{col.title}</h2>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-desk-muted hover:text-desk-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-5 border-t border-desk-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-desk-faint">
          <p>© {new Date().getFullYear()} Gapl. All rights reserved.</p>
          <p>Scores are AI estimates. Every verdict comes with its reasons.</p>
        </div>
      </div>
    </footer>
  );
}
