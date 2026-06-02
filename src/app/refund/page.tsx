import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Refund Policy — Gapl",
  description: "Refund policy and terms for paid plans on Gapl.",
};

export default function RefundPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 bg-[#FAFAFA] min-h-screen text-[#111111]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">
            Refund Policy
          </h1>
          <p className="text-sm text-zinc-500 mb-8">
            Last updated: June 2, 2026
          </p>
          <div className="prose prose-zinc max-w-none space-y-6 text-sm text-zinc-700 leading-relaxed">
            <p>
              Thank you for choosing Gapl to help accelerate your job readiness. We stand behind our product, but we also want to make sure you have a fair and transparent experience.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">1. General Policy</h2>
            <p>
              Due to the immediate compute resources consumed by our AI-powered deep-analysis reports and recruiter simulations, we generally do not offer refunds once a credits package or premium plan has been actively used to generate report analyses.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">2. Eligibility for Refunds</h2>
            <p>
              We want to be reasonable. You may be eligible for a full or partial refund under the following conditions:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You purchased a premium plan or credit pack but have not generated any report analyses.</li>
              <li>You experienced a documented technical failure (e.g., payment was charged, but system failed to grant credits or run the analysis, and support could not resolve it).</li>
              <li>A duplicate transaction occurred due to a payment gateway error.</li>
            </ul>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">3. Requesting a Refund</h2>
            <p>
              To request a refund, please send an email to{" "}
              <a href="mailto:hello@gapl.in" className="text-primary-600 font-medium hover:underline">
                hello@gapl.in
              </a>{" "}
              within 7 days of the transaction. Please include:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your account email address</li>
              <li>The Razorpay transaction ID</li>
              <li>A brief description of why you are requesting a refund</li>
            </ul>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">4. Processing Refunds</h2>
            <p>
              Once your request is approved, we will process the refund. The refund amount will automatically be credited back to your original payment method within 5 to 7 working days, subject to your bank&apos;s processing timelines.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
