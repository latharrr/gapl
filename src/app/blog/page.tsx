import type { Metadata } from "next";
import Link from "next/link";
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
      <main className="pt-24 pb-16 bg-[#FAFAFA] min-h-screen text-[#111111]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">
            Gapl Blog
          </h1>
          <p className="text-lg text-zinc-500 mb-12">
            No fluff. Just tactical advice on building strong engineering signals and getting shortlisted.
          </p>

          <div className="space-y-12">
            {POSTS.map((post) => (
              <article key={post.slug} className="border-b border-zinc-200 pb-8 last:border-b-0">
                <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="text-2xl font-bold text-zinc-950 hover:text-zinc-800 transition-colors mb-3">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className="text-zinc-600 text-sm leading-relaxed mb-4">
                  {post.excerpt}
                </p>
                <Link href={`/blog/${post.slug}`} className="text-xs font-semibold text-zinc-900 hover:text-zinc-700 underline underline-offset-4">
                  Read article
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
