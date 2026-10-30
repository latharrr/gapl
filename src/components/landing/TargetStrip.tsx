import { ROLES, TIERS } from "@/lib/targets";

// Gem's logo marquee, made honest: the roles and company tiers Gapl reads for, not logos we can't claim.
const ITEMS = [...ROLES, ...TIERS.map((t) => t.label)];

export function TargetStrip() {
  return (
    <section className="landing border-b border-border-DEFAULT">
      <div className="flex items-center overflow-hidden">
        <p className="shrink-0 border-r border-border-DEFAULT px-4 sm:px-8 py-6 text-[0.9375rem] text-ink-secondary">Read for</p>
        <div className="marquee flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
          <ul className="marquee-track flex w-max gap-14 pr-14">
            {[...ITEMS, ...ITEMS].map((item, i) => (
              <li key={i} aria-hidden={i >= ITEMS.length} className="serif-display whitespace-nowrap text-[1.75rem] tracking-[-0.03em] text-ink">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
