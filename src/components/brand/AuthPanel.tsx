import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { LedBoard } from "@/components/brand/LedBoard";
import { VerdictBadge } from "@/components/ui/Badge";

// Left half of the auth screens: the rail-navy side of the platform.
export function AuthPanel({ headline, lines }: { headline: string; lines: string[] }) {
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-1/2 bg-primary-600 text-primary-foreground p-12 justify-between border-r-[3px] border-board">
      <Link href="/" aria-label="Gapl home" className="self-start">
        <Wordmark />
      </Link>

      <div>
        <h2 className="display text-[clamp(2.2rem,3.6vw,3.5rem)] max-w-lg">{headline}</h2>
        <ol className="mt-8 space-y-3 max-w-md">
          {(["Reject", "Maybe", "Shortlist"] as const).map((v, i) => (
            <li key={v} className="flex items-start gap-4">
              <VerdictBadge verdict={v} size="sm" className="bg-surface-DEFAULT shrink-0 w-[8.5rem] justify-center" />
              <span className="text-[0.9375rem] text-primary-100 pt-0.5">{lines[i]}</span>
            </li>
          ))}
        </ol>
      </div>

      <LedBoard
        tag="GAPL"
        messages={["SCORES ARE ESTIMATES", "THE REASONS STAY VISIBLE"]}
        className="h-11 px-4 text-[1rem] max-w-md"
      />
    </div>
  );
}

// Below lg the navy half is hidden; this rail bar keeps the world on phones.
export function AuthMobileBar() {
  return (
    <header className="lg:hidden bg-primary-600 border-b-[3px] border-board">
      <div className="h-14 px-4 flex items-center justify-between">
        <Link href="/" aria-label="Gapl home">
          <Wordmark size="sm" />
        </Link>
        <Link href="/" className="text-sm font-medium text-primary-100 hover:text-white">
          Back to home
        </Link>
      </div>
    </header>
  );
}
