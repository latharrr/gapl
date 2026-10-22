import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Blog — Gapl",
  description: "Insights on application readiness, resume reviews, and breaking into tech.",
};

const POSTS = [
  {
    slug: "why-ats-scores-are-a-myth",
    title: "Why ATS Scores are a Myth (and What Actually Matters)",
    excerpt: "Most resume builders tell you to optimize for ATS algorithms. We explain why hiring managers bypass ATS scoring, and what signals they really search for.",
    date: "June 1, 2026",
    readTime: "5 min read",
  },
  {
    slug: "building-project-evidence-that-convinces",
    title: "How to Build Project Evidence That Convinces Recruiters",
    excerpt: "Generic clone projects are a red flag. Learn how documenting performance optimizations, system limits, and staging deployments makes your resume stand out.",
    date: "May 25, 2026",
    readTime: "7 min read",
  },
];

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="on-desk pt-16 min-h-screen">
        <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
          <h1 className="display text-[clamp(2.2rem,5.5vw,3.75rem)]">Gapl blog</h1>
          <p className="mt-4 text-lg sm:text-xl leading-relaxed text-desk-muted max-w-[60ch]">
            No fluff. Tactical advice on building strong engineering signals and getting shortlisted.
          </p>
        </header>

        <div className="max-w-4xl mx-auto px-0 sm:px-6 pb-16 sm:pb-24">
          <ol className="page sm:rounded-[4px] px-5 sm:px-10 divide-y divide-border-DEFAULT">
            {POSTS.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`} className="group grid gap-x-8 gap-y-2 py-8 sm:grid-cols-[9rem_minmax(0,1fr)]">
                  <p className="tabular text-sm text-ink-muted pt-1">
                    {post.date}
                    <span className="block">{post.readTime}</span>
                  </p>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-[-0.02em] leading-tight group-hover:text-primary-700">{post.title}</h2>
                    <p className="mt-2 text-[1.0625rem] leading-relaxed text-ink-secondary max-w-[62ch]">{post.excerpt}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
                      Read the article <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <Footer />
    </>
  );
}
