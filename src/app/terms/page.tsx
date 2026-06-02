import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service — Gapl",
  description: "Terms and conditions for using the Gapl platform.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 bg-[#FAFAFA] min-h-screen text-[#111111]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">
            Terms of Service
          </h1>
          <p className="text-sm text-zinc-500 mb-8">
            Last updated: June 2, 2026
          </p>
          <div className="prose prose-zinc max-w-none space-y-6 text-sm text-zinc-700 leading-relaxed">
            <p>
              Welcome to Gapl. By accessing or using our platform, website, and services, you agree to be bound by these Terms of Service.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using Gapl, you accept these terms in full. If you do not agree to these terms, you must not access or use our services.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">2. Account Registration</h2>
            <p>
              You must provide accurate and complete information when registering an account. You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">3. Use of Services</h2>
            <p>
              Gapl provides AI-powered resume and readiness intelligence tools. You agree to use the services only for lawful purposes and in accordance with these Terms. You shall not upload any malicious files, attempt to bypass restrictions, or scrape the platform.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">4. Payment and Subscriptions</h2>
            <p>
              Certain features require payment or subscription plans. All payments are processed securely via Razorpay. You agree to pay all fees associated with your chosen plan.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">5. Disclaimer of Warranties</h2>
            <p>
              Gapl is provided on an &quot;as is&quot; and &quot;as available&quot; basis. While we strive to provide accurate intelligence, we make no guarantees regarding interview shortlists, job offers, or placement success.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Gapl and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use or inability to use the service.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">7. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account and access to the services at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">8. Contact Information</h2>
            <p>
              If you have any questions regarding these Terms of Service, please reach out to us at{" "}
              <a href="mailto:hello@gapl.in" className="text-primary-600 font-medium hover:underline">
                hello@gapl.in
              </a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
