import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQ } from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "Pricing — Gapl",
  description:
    "Simple, transparent pricing. Start free and upgrade when you need depth.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[59px] bg-surface-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
          <div className="signboard px-5 py-6 sm:px-10 sm:py-8">
            <h1 className="display text-[clamp(2.4rem,6vw,4.75rem)]">Fare chart.</h1>
            <p className="mt-3 text-base sm:text-lg font-semibold">
              Start free. Pay once when you need more analyses. No subscriptions.
            </p>
          </div>
        </div>
        <PricingSection heading={false} />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
