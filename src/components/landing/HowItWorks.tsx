import { HOW_IT_WORKS_STEPS } from "@/lib/mock-data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-primary-600 text-primary-foreground scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-14">
        <h2 className="display text-[clamp(2rem,4vw,3.25rem)]">How your chart is prepared.</h2>

        <ol className="chart-sheet rounded-[6px] overflow-hidden text-ink chart-rows">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <li
              key={step.step}
              className="grid gap-x-5 gap-y-1 px-4 sm:px-6 py-4 sm:grid-cols-[6.5rem_12rem_minmax(0,1fr)] sm:items-baseline"
            >
              <span className="chart-data text-xs font-bold text-primary-600">
                {i + 1} · {step.step}
              </span>
              <h3 className="font-bold">{step.title}</h3>
              <p className="text-[0.9375rem] leading-relaxed text-ink-secondary">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
