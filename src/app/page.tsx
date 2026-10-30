import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { ReadSection } from "@/components/landing/ReadSection";
import { FixSection } from "@/components/landing/FixSection";
import { TargetStrip } from "@/components/landing/TargetStrip";
import { HowSection } from "@/components/landing/HowSection";
import { Statement } from "@/components/landing/Statement";
import { FilmSection } from "@/components/landing/FilmSection";
import { LoopSection } from "@/components/landing/LoopSection";
import { MarksSection } from "@/components/landing/MarksSection";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { PriceList } from "@/components/landing/PriceList";
import { FAQ } from "@/components/landing/FAQ";
import { CTASection } from "@/components/landing/CTASection";

export const metadata: Metadata = {
  title: "Gapl — See what a recruiter sees in your resume",
  description:
    "Recruiters give your resume six seconds. Gapl reads it the same way for your role and company tier, shows the line that sank it, and tells you what to build next.",
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
    title: "Gapl — Six seconds. Here's what they saw.",
    description:
      "Your resume, read the way a recruiter reads it. The verdict, the reason, and what to build next.",
    type: "website",
    url: "https://gapl.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gapl — Six seconds. Here's what they saw.",
    description:
      "Your resume, read the way a recruiter reads it. The verdict, the reason, and what to build next.",
  },
};

export default function HomePage() {
  return (
    <SmoothScroll>
      <main className="landing">
        <Navbar />
        <HeroSection />
        <TargetStrip />
        <HowSection />
        <Statement />
        <FilmSection />
        <ReadSection />
        <FixSection />
        <LoopSection />
        <MarksSection />
        <PriceList />
        <FAQ />
        <CTASection />
        <Footer />
      </main>
    </SmoothScroll>
  );
}
