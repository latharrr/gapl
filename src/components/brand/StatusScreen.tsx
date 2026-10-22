import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { buttonBase, buttonSizes, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* Full-screen status page (404, errors): a plain headline, the status in red pen, two ways forward. */
export function StatusScreen({
  mark,
  title,
  body,
  actions,
  homeLink = true,
}: {
  mark: string;
  title: string;
  body: React.ReactNode;
  actions: React.ReactNode;
  homeLink?: boolean;
}) {
  return (
    <div className="min-h-screen on-desk flex flex-col">
      <header className="px-4 sm:px-6 h-16 flex items-center max-w-5xl w-full mx-auto">
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
          <h1 className="display max-w-3xl text-[clamp(2.4rem,6vw,4.5rem)]">{title}</h1>
          <p className="mt-4 max-w-xl text-lg text-desk-muted">
            <span className="font-semibold text-danger-on-desk">{mark}.</span> {body}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">{actions}</div>
        </div>
      </main>
    </div>
  );
}

export const ghostOnDark = cn(buttonBase, buttonVariants.desk, buttonSizes.lg);
