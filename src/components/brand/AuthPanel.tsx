import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { SampleResume } from "@/components/brand/SampleResume";

// Left half of the auth screens: the desk, the headline, and the marked sample page.
export function AuthPanel({ headline, lines }: { headline: string; lines: string[] }) {
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-1/2 on-desk border-r border-desk-line p-12 xl:p-16 gap-10 overflow-hidden">
      <Link href="/" aria-label="Gapl home" className="self-start">
        <Wordmark />
      </Link>

      <div className="max-w-lg">
        <h2 className="display text-[clamp(2.2rem,3.4vw,3.25rem)]">{headline}</h2>
        <ul className="mt-6 space-y-2.5">
          {lines.map((line) => (
            <li key={line} className="flex items-start gap-3 text-[0.9375rem] text-desk-muted">
              <span aria-hidden className="mt-[0.6em] h-[2px] w-3 shrink-0 bg-highlight" />
              {line}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative -mb-40 max-w-[30rem] rotate-[-1.5deg]">
        <SampleResume animate={false} />
      </div>
    </div>
  );
}

// Below lg the desk half is hidden; this bar keeps the world on phones.
export function AuthMobileBar() {
  return (
    <header className="lg:hidden on-desk">
      <div className="h-14 px-4 flex items-center justify-between">
        <Link href="/" aria-label="Gapl home">
          <Wordmark size="sm" />
        </Link>
        <Link href="/" className="text-sm font-medium text-desk-muted hover:text-desk-ink">
          Back to home
        </Link>
      </div>
    </header>
  );
}
