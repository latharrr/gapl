import Image from "next/image";

// Gem's card row: three stills from the film's world, one per mark.
const MARKS = [
  { img: "mark-highlighter", pos: "object-[62%_45%] scale-[1.35]", tint: "bg-highlight-soft", mark: "Highlighter", title: "What caught the eye", line: "The lines a recruiter actually read, and why they held." },
  { img: "mark-redpen", pos: "object-[55%_40%] scale-[1.25]", tint: "bg-danger-bg", mark: "Red pen", title: "What sank it", line: "The one line that cost you the shortlist, circled." },
  { img: "mark-bluepen", pos: "object-[30%_65%] scale-[1.3]", tint: "bg-primary-50", mark: "Blue pen", title: "What to build next", line: "A project, how long it takes, and what it changes." },
];

export function MarksSection() {
  return (
    <section className="landing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <h2 data-rise className="max-w-3xl serif-display text-[clamp(2.5rem,4.6vw,4rem)]">Three marks. Nothing else to decode.</h2>
        <ul className="mt-14 -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] md:mx-0 md:px-0 md:grid md:gap-5 md:grid-cols-3 md:overflow-visible">
          {MARKS.map((m) => (
            <li key={m.mark} data-rise className="w-[80%] shrink-0 snap-start md:w-auto group rounded-[12px] border border-border-DEFAULT bg-white overflow-hidden transition-transform duration-500 hover:-translate-y-1">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={`/living/img/${m.img}.jpg`} alt={`${m.mark} on a printed resume in sunlight`} fill sizes="(min-width: 768px) 33vw, 100vw"
                  className={`object-cover ${m.pos} transition-transform duration-700 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.42]`} />
              </div>
              <div className={`p-6 ${m.tint}`}>
                <p className="field-label">{m.mark}</p>
                <h3 className="mt-2 text-[1.375rem] font-semibold tracking-[-0.02em]">{m.title}</h3>
                <p className="mt-2 text-[0.9375rem] text-ink-muted">{m.line}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
