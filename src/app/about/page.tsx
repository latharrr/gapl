import type { Metadata } from "next";
import { ReadingPage } from "@/components/layout/ReadingPage";

export const metadata: Metadata = {
  title: "About Us — Gapl",
  description: "Learn about the mission behind Gapl: Application Readiness Intelligence.",
};

export default function AboutPage() {
  return (
    <ReadingPage title="About Gapl" lead="We don't build resumes. We help you build readiness.">
            <p>
              In today&apos;s competitive tech market, job seekers are often left in the dark. You submit hundreds of applications, get automated rejections, and never know why. Traditional tools focus on ATS keyword matching or formatting percentages. But recruiters don&apos;t hire templates; they hire signals.
            </p>
            <p>
              Gapl was founded to solve this information asymmetry. We built an <strong>Application Readiness Engine</strong> designed to answer the questions that actually matter:
            </p>
            <ul>
              <li>Why will my application get rejected?</li>
              <li>What crucial engineering signals am I missing?</li>
              <li>How competitive is my code deployment compared to other candidates?</li>
              <li>What specific evidence should I build next to get shortlisted?</li>
            </ul>

            <h2>Our Philosophy</h2>
            <p>
              We believe in evidence over credentials. A candidate who can demonstrate clear proof of project deployment, testing coverage, and architectural understanding will always outperform a generic candidate. Gapl parses your credentials and simulates a recruiter review to tell you where your evidence is weak, giving you a step-by-step roadmap to build the missing pieces.
            </p>

            <h2>Contact the Team</h2>
            <p>
              Have feedback, questions, or ideas? We are always listening. Drop us a line at{" "}
              <a href="mailto:deepanshulathar@gmail.com">
                deepanshulathar@gmail.com
              </a>.
            </p>
          </ReadingPage>
  );
}
