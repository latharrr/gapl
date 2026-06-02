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
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-ink tracking-tight mb-3">
            Straightforward pricing.
          </h1>
          <p className="text-lg text-ink-muted">
            Start free. Upgrade when you&apos;re serious.
          </p>
        </div>
        <PricingSection />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
