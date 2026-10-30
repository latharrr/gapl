import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CREDIT_PACKS, pricePerCredit } from "@/lib/plans";
import { cn } from "@/lib/utils";

// Pricing as a printed price list on the highlighter band: one row per pack, the price set large.
export function PriceList({ as: H = "h2" }: { as?: "h1" | "h2" }) {
  const rows = [
    { name: "Free", note: "One read when you sign up.", credits: 1, price: 0, each: "", href: "/auth/signup", cta: "Start free", chosen: false },
    ...CREDIT_PACKS.map((p) => ({
      name: p.name, note: p.description, credits: p.credits, price: p.priceInr,
      each: `₹${pricePerCredit(p)} a read`, href: "/dashboard/billing", cta: `Get ${p.credits}`, chosen: p.highlighted,
    })),
  ];
  return (
    <section id="pricing" className="bg-highlight-soft text-ink scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <H data-rise className="serif-display text-[clamp(2.75rem,5vw,4.5rem)]">First read free. Then pay once.</H>
          <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink-secondary">
            Every pack gets the full report, the roadmap and the CV tools. No subscription, and credits never expire.
          </p>
        </div>
        <ul className="lg:col-span-8 border-t-2 border-ink">
          {rows.map((r) => (
            <li key={r.name} data-rise className={cn("grid grid-cols-[1fr_auto] sm:grid-cols-[9rem_1fr_auto_auto] items-center gap-x-6 gap-y-1 border-b border-ink/15 py-6", r.chosen && "bg-white/60 -mx-4 px-4 sm:-mx-5 sm:px-5")}>
              <p className="text-[1.0625rem] font-semibold">
                {r.name}
                {r.chosen && <span className="ml-2 align-middle text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-muted">Most picked</span>}
              </p>
              <p className="order-3 col-span-2 sm:order-none sm:col-span-1 text-[0.9375rem] text-ink-secondary">
                {r.note} <span className="text-ink-muted">{r.credits} {r.credits === 1 ? "credit" : "credits"}{r.each && ` · ${r.each}`}</span>
              </p>
              <p className="serif-display text-[2.75rem] leading-none text-right">₹{r.price}</p>
              <Link href={r.href} className={cn(
                "order-4 col-span-2 mt-3 justify-center sm:order-none sm:col-span-1 sm:mt-0 inline-flex h-11 items-center gap-1.5 rounded-[2px] px-4 text-sm font-semibold transition-colors",
                r.chosen ? "bg-ink text-white hover:bg-ink-secondary" : "border border-ink/25 hover:border-ink"
              )}>
                {r.cta} <ArrowRight size={15} />
              </Link>
            </li>
          ))}
          <li className="pt-4 text-sm text-ink-muted">
            Prices in INR, paid once through Razorpay. A read, a CV build and a tailoring each use one credit.
          </li>
        </ul>
      </div>
    </section>
  );
}
