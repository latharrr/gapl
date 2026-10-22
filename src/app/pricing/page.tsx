import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQ } from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "Pricing — Gapl",
  description: "Start free with one analysis a month. Paid plans add more analyses each month, priced in INR.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <section className="on-desk">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-14 sm:pb-16">
            <h1 className="display max-w-4xl text-[clamp(2.6rem,6vw,4.75rem)] leading-[1.04]">
              Start free. <span className="hero-hl">Pay when you&apos;re re-checking.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-desk-muted">
              Every plan gets the full report, roadmap and CV tools. Plans differ only in how many analyses you get each
              month.
            </p>
          </div>
        </section>
        <PricingSection heading={false} />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
