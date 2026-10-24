import type { Metadata } from "next";
import { ReadingPage } from "@/components/layout/ReadingPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Gapl",
  description: "How we collect, use, and protect your information at Gapl.",
};

export default function PrivacyPolicyPage() {
  return (
    <ReadingPage title="Privacy Policy" meta="Last updated: June 2, 2026">
            <p>
              At Gapl, we take your privacy seriously. This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us when you create an account, upload a resume or job description, or communicate with us. This information may include:
            </p>
            <ul>
              <li>Contact information (such as name and email address)</li>
              <li>Authentication credentials (via Firebase Auth)</li>
              <li>Resume data, work experience, and education details</li>
              <li>Billing and transaction details (processed securely via Razorpay)</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              We use the collected information for various purposes, including to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our Application Readiness Intelligence</li>
              <li>Process transactions and send related billing information</li>
              <li>Send technical notices, updates, security alerts, and support messages</li>
              <li>Analyze usage trends and improve user experience</li>
            </ul>

            <h2>3. Data Security & Storage</h2>
            <p>
              We store your data securely using Firebase Firestore and Firebase Storage. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, loss, or alteration.
            </p>

            <h2>4. Sharing Your Data</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share data with service providers (such as AI model providers for resume analysis, and Razorpay for payment processing) strictly to perform services on our behalf.
            </p>

            <h2>5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information stored on Gapl. You can request account deletion at any time by contacting support.
            </p>

            <h2>6. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please reach out to us at{" "}
              <a href="mailto:deepanshulathar@gmail.com" className="text-primary-600 font-medium hover:underline">
                deepanshulathar@gmail.com
              </a>.
            </p>
          </ReadingPage>
  );
}
