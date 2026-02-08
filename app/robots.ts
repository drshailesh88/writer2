import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://v1drafts.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/plagiarism-free", "/privacy", "/terms"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/editor/",
          "/library/",
          "/account/",
          "/subscription/",
          "/sign-in/",
          "/sign-up/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
