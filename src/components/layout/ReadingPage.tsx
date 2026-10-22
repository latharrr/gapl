import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* Long-form pages (legal, about, blog): a title on the desk, then one readable sheet of paper. */
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
      <main className="on-desk pt-16 min-h-screen">
        <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
          {back && <div className="mb-5">{back}</div>}
          <h1 className="display text-[clamp(2.2rem,5.5vw,3.75rem)]">{title}</h1>
          {lead && <p className="mt-4 text-lg sm:text-xl leading-relaxed text-desk-muted max-w-[60ch]">{lead}</p>}
          {meta && <p className="tabular mt-4 text-xs text-desk-faint">{meta}</p>}
        </header>
        <div className="max-w-3xl mx-auto px-0 sm:px-6 pb-16 sm:pb-24">
          <div className="page sm:rounded-[4px] px-5 sm:px-12 py-10 sm:py-14">
            <div className="reading">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
