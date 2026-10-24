import type { MetadataRoute } from "next";

const POSTS = ["why-ats-scores-are-a-myth", "building-project-evidence-that-convinces"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.vercel.app";
  const pages = ["", "/demo", "/pricing", "/about", "/blog", "/privacy", "/terms", "/refund"];
  return [
    ...pages.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: (path === "" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" ? 1 : path === "/demo" || path === "/pricing" ? 0.8 : 0.5,
    })),
    ...POSTS.map((slug) => ({ url: `${base}/blog/${slug}`, changeFrequency: "yearly" as const, priority: 0.4 })),
  ];
}
