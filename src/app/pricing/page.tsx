import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PriceList } from "@/components/landing/PriceList";
import { FAQ } from "@/components/landing/FAQ";

export const metadata: Metadata = {
  title: "Pricing — Gapl",
  description: "Start free with one analysis. Then buy credits once, from ₹99 for 4. No subscription, and credits never expire.",
};

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <PriceList as="h1" />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
