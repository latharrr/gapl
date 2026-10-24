import type { Metadata } from "next";
import { ReadingPage } from "@/components/layout/ReadingPage";

export const metadata: Metadata = {
  title: "Refund Policy — Gapl",
  description: "Refund policy for Gapl credit packs.",
};

export default function RefundPolicyPage() {
  return (
    <ReadingPage title="Refund Policy" meta="Last updated: June 2, 2026">
            <p>
              Thank you for choosing Gapl to help accelerate your job readiness. We stand behind our product, but we also want to make sure you have a fair and transparent experience.
            </p>

            <h2>1. General Policy</h2>
            <p>
              Due to the immediate compute resources consumed by our AI-powered deep-analysis reports and recruiter simulations, we generally do not offer refunds once credits from a pack have been used.
            </p>

            <h2>2. Eligibility for Refunds</h2>
            <p>
              We want to be reasonable. You may be eligible for a full or partial refund under the following conditions:
            </p>
            <ul>
              <li>You bought a credit pack and have not used any of its credits.</li>
              <li>You experienced a documented technical failure (e.g., payment was charged, but system failed to grant credits or run the analysis, and support could not resolve it).</li>
              <li>A duplicate transaction occurred due to a payment gateway error.</li>
            </ul>

            <h2>3. Requesting a Refund</h2>
            <p>
              To request a refund, please send an email to{" "}
              <a href="mailto:deepanshulathar@gmail.com" className="text-primary-600 font-medium hover:underline">
                deepanshulathar@gmail.com
              </a>{" "}
              within 7 days of the transaction. Please include:
            </p>
            <ul>
              <li>Your account email address</li>
              <li>The Razorpay transaction ID</li>
              <li>A brief description of why you are requesting a refund</li>
            </ul>

            <h2>4. Processing Refunds</h2>
            <p>
              Once your request is approved, we will process the refund. The refund amount will automatically be credited back to your original payment method within 5 to 7 working days, subject to your bank&apos;s processing timelines.
            </p>
          </ReadingPage>
  );
}
