import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FAQ } from "@/components/landing/FAQ";
import { CTASection } from "@/components/landing/CTASection";

export const metadata: Metadata = {
  title: "Gapl — Application Readiness Engine for Job Seekers",
  description:
    "Know why you're not getting shortlisted. Gapl analyzes your resume, simulates recruiter review, identifies skill gaps, and tells you exactly what to build next.",
  keywords: [
    "resume analyzer",
    "job readiness",
    "ATS score",
    "skill gap analysis",
    "career roadmap",
    "recruiter simulation",
    "SDE intern",
    "placement preparation",
  ],
  openGraph: {
    title: "Gapl — Application Readiness Engine",
    description: "Know why you're not getting shortlisted. Fix it.",
    type: "website",
    url: "https://gapl.in",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gapl — Application Readiness Engine",
    description: "Know why you're not getting shortlisted. Fix it.",
  },
};

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <PricingSection />
      <FAQ />
      <CTASection />
      <Footer />
    </main>
  );
}
