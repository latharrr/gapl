import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* Long-form pages (legal, about, blog): a title plate, then one readable column of print. */
export function ReadingPage({
  title,
  meta,
  lead,
  back,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  lead?: React.ReactNode;
  back?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="pt-[59px] bg-surface-muted min-h-screen">
        <header className="border-b-[1.5px] border-ink bg-surface-DEFAULT">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8 sm:pb-10">
            {back && <div className="mb-4">{back}</div>}
            <h1 className="display text-[clamp(2.2rem,5.5vw,3.75rem)]">{title}</h1>
            {lead && <p className="mt-4 text-lg sm:text-xl leading-relaxed text-ink-secondary max-w-[60ch]">{lead}</p>}
            {meta && <p className="chart-data mt-4 text-xs text-ink-muted">{meta}</p>}
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="reading">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
