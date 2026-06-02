import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Gapl",
  description: "How we collect, use, and protect your information at Gapl.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 bg-[#FAFAFA] min-h-screen text-[#111111]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-500 mb-8">
            Last updated: June 2, 2026
          </p>
          <div className="prose prose-zinc max-w-none space-y-6 text-sm text-zinc-700 leading-relaxed">
            <p>
              At Gapl, we take your privacy seriously. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when you create an account, upload a resume or job description, or communicate with us. This information may include:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Contact information (such as name and email address)</li>
              <li>Authentication credentials (via Firebase Auth)</li>
              <li>Resume data, work experience, and education details</li>
              <li>Billing and transaction details (processed securely via Razorpay)</li>
            </ul>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">2. How We Use Your Information</h2>
            <p>
              We use the collected information for various purposes, including to:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide, maintain, and improve our Application Readiness Intelligence</li>
              <li>Process transactions and send related billing information</li>
              <li>Send technical notices, updates, security alerts, and support messages</li>
              <li>Analyze usage trends and improve user experience</li>
            </ul>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">3. Data Security & Storage</h2>
            <p>
              We store your data securely using Firebase Firestore and Firebase Storage. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, loss, or alteration.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">4. Sharing Your Data</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share data with service providers (such as AI model providers for resume analysis, and Razorpay for payment processing) strictly to perform services on our behalf.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information stored on Gapl. You can request account deletion at any time by contacting support.
            </p>

            <h2 className="text-lg font-bold text-zinc-900 pt-4">6. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please reach out to us at{" "}
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
