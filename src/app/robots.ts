import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://gapl.in";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in, per-user and internal areas stay out of search results.
      disallow: ["/admin", "/dashboard", "/report/", "/api/", "/auth/", "/analyze", "/tailor", "/cv-builder"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
