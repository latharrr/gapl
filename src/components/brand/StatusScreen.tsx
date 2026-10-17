import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

/* Full-screen status page (404, errors): LED line, plain words, two ways forward. */
export function StatusScreen({
  led,
  title,
  body,
  actions,
  homeLink = true,
}: {
  led: string;
  title: string;
  body: React.ReactNode;
  actions: React.ReactNode;
  homeLink?: boolean;
}) {
  return (
    <div className="min-h-screen led-ground text-surface-muted flex flex-col">
      <header className="px-4 sm:px-6 h-14 flex items-center max-w-5xl w-full mx-auto">
        {homeLink ? (
          <Link href="/" aria-label="Gapl home">
            <Wordmark size="sm" />
          </Link>
        ) : (
          <Wordmark size="sm" />
        )}
      </header>
      <main className="flex-1 flex items-center px-4 sm:px-6 pb-16">
        <div className="max-w-5xl w-full mx-auto">
          <div className="led-board inline-flex h-11 items-center rounded-[4px] border border-led-dim bg-black/30 px-4 text-[1.05rem]">
            {led}
          </div>
          <h1 className="display mt-6 max-w-3xl text-[clamp(2.4rem,6vw,4.5rem)]">{title}</h1>
          <p className="mt-4 max-w-xl text-lg text-surface-muted/75">{body}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">{actions}</div>
        </div>
      </main>
    </div>
  );
}

export const ghostOnDark =
  "h-12 px-6 inline-flex items-center justify-center rounded-[6px] border-[1.5px] border-surface-muted/30 text-[0.9375rem] font-semibold text-surface-muted hover:border-surface-muted/70";
