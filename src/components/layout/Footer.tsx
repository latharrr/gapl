import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Sample report", href: "/demo" },
      { label: "Pricing", href: "/pricing" },
      { label: "Analyze my resume", href: "/analyze" },
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
    <footer className="bg-primary-600 text-primary-100 border-t-[3px] border-board">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-x-8 gap-y-10">
          <div className="col-span-2 md:col-span-1 max-w-xs">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-primary-100">
              Application readiness for placement season. An honest verdict on your resume, and what to build next.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-bold uppercase tracking-[0.08em] text-board mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-primary-100 hover:text-white hover:underline">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-primary-100/80">
          <p>© {new Date().getFullYear()} Gapl. All rights reserved.</p>
          <p>Scores are AI estimates. Every verdict comes with its reasons.</p>
        </div>
      </div>
    </footer>
  );
}
