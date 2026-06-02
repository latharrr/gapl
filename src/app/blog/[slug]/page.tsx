import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const POSTS: Record<string, { title: string; date: string; readTime: string; content: string[] }> = {
  "why-ats-scores-are-a-myth": {
    title: "Why ATS Scores are a Myth (and What Actually Matters)",
    date: "June 1, 2026",
    readTime: "5 min read",
    content: [
      "If you've spent any time on career forums, you've heard the advice: 'Run your resume through an ATS checker to optimize your score.' The common myth is that an Applicant Tracking System (ATS) automatically rejects resumes below a certain percentage match score. But here's the reality: ATS systems are database tools, not automated decision-makers.",
      "Most modern ATS tools (like Greenhouse, Lever, or Workday) store your resume, parse text so recruiters can search it, and display it for human review. Recruiters don't look at a generic matching percentage; they search for specific, hard-to-fake signals.",
      "Instead of focusing on arbitrary keyword density scores, your application stands out when you highlight clear engineering evidence, such as:",
      "1. Testing Coverage & CI/CD Pipelines: Show that your code is deployable and reliable. Mentioning that you configured GitHub Actions and maintained a 90% unit test coverage carries significant weight.",
      "2. Infrastructure Performance: Describe the scale of your systems. 'Optimized MongoDB indexing to reduce query latency by 40%' is much more compelling than a generic list of technologies.",
      "3. Production Deployments: Provide live links. A deployed application showing actual traffic or telemetry metrics immediately separates you from the crowd.",
      "Focus on building and highlighting these concrete signals rather than trying to game a scoring algorithm. That's how you get shortlisted."
    ]
  },
  "building-project-evidence-that-convinces": {
    title: "How to Build Project Evidence That Convinces Recruiters",
    date: "May 25, 2026",
    readTime: "7 min read",
    content: [
      "For junior developers, clone projects (like a basic Netflix clone or a standard Todo app) are a dime a dozen. When a recruiter or hiring manager sees these on a resume, it tells them very little about your actual engineering capabilities.",
      "To stand out, your projects need to demonstrate evidence of professional engineering practices. This means moving beyond 'it runs locally' to 'it operates in production.'",
      "Key elements of convincing project evidence include:",
      "- Performance Optimizations: Did you implement caching, image lazy-loading, or DB query optimizations? Document the before and after measurements.",
      "- Testing & Quality Assurance: Write unit and integration tests. Include a badge or line showing test coverage.",
      "- Scalability & Resilience: Explain how the system handles error states, rate limiting, or high concurrent traffic.",
      "- Public Staging & Telemetry: Deploy your project publicly. Add monitoring (like basic Sentry or Prometheus) and make the dashboard public. Showing that you monitor your project's health shows immense maturity.",
      "By adding these professional engineering signals to your projects, you transform your resume from a list of tutorials into a portfolio of production-grade systems."
    ]
  }
};

export async function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 bg-[#FAFAFA] min-h-screen text-[#111111]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/blog" className="text-xs font-semibold text-zinc-500 hover:text-zinc-700 mb-6 inline-block">
            ← Back to blog
          </Link>
          <div className="flex items-center gap-3 text-xs text-zinc-400 mb-4">
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-8">
            {post.title}
          </h1>
          <div className="prose prose-zinc max-w-none space-y-6 text-sm text-zinc-700 leading-relaxed">
            {post.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
