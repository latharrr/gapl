import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "About Us — Gapl",
  description: "Learn about the mission behind Gapl: Application Readiness Intelligence.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 bg-[#FAFAFA] min-h-screen text-[#111111]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">
            About Gapl
          </h1>
          <div className="prose prose-zinc max-w-none space-y-6 text-sm text-zinc-700 leading-relaxed">
            <p className="text-lg text-zinc-600 font-medium leading-relaxed">
              We don&apos;t build resumes. We help you build readiness.
            </p>
            <p>
              In today&apos;s competitive tech market, job seekers are often left in the dark. You submit hundreds of applications, get automated rejections, and never know why. Traditional tools focus on ATS keyword matching or formatting percentages. But recruiters don&apos;t hire templates; they hire signals.
            </p>
            <p>
              Gapl was founded to solve this information asymmetry. We built the first **Application Readiness Engine** designed to answer the questions that actually matter:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Why will my application get rejected?</li>
              <li>What crucial engineering signals am I missing?</li>
              <li>How competitive is my code deployment compared to other candidates?</li>
              <li>What specific evidence should I build next to get shortlisted?</li>
            </ul>

            <h2 className="text-xl font-bold text-zinc-900 pt-6">Our Philosophy</h2>
            <p>
              We believe in evidence over credentials. A candidate who can demonstrate clear proof of project deployment, testing coverage, and architectural understanding will always outperform a generic candidate. Gapl parses your credentials and simulates a recruiter review to tell you where your evidence is weak, giving you a step-by-step roadmap to build the missing pieces.
            </p>

            <h2 className="text-xl font-bold text-zinc-900 pt-6">Contact the Team</h2>
            <p>
              Have feedback, questions, or ideas? We are always listening. Drop us a line at{" "}
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
