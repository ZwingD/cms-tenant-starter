// app/blog/_static/articles.ts
/**
 * Baked-in sample articles for STATIC mode (CMS_BLOG_SOURCE=STATIC).
 *
 * This file lets the storefront ship-and-deploy before a real CMS webhook
 * is wired. Once you flip CMS_BLOG_SOURCE=CMS in your Vercel env and
 * register the webhook (see README), the reader switches to live CMS
 * data and this file becomes a fallback (used only if the CMS API is
 * unreachable).
 *
 * Replace or remove these samples once you've published a few real posts.
 */
import type { BlogPost } from "../../../lib/cms/types";

export const sampleArticles: BlogPost[] = [
  {
    id: "static-1",
    slug: "welcome",
    title: "Welcome to your new tenant site",
    excerpt:
      "This is a placeholder post served from the starter's static fallback. Flip CMS_BLOG_SOURCE=CMS in Vercel once your webhook is registered.",
    contentHtml:
      "<p>You're looking at a static placeholder. The real CMS content will appear here after you complete the integration steps in the README.</p>",
    publishedAt: new Date().toISOString(),
    author: { name: "Zwingd" },
  },
  {
    id: "static-2",
    slug: "how-revalidation-works",
    title: "How revalidation works in this starter",
    excerpt:
      "On every CMS edit, cms-backend POSTs a signed webhook to /api/revalidate. The handler invalidates both the detail tag and the list tag.",
    contentHtml:
      "<p>The starter ships with <code>@zwingd/cms-revalidate-nextjs</code>. The handler verifies HMAC, then revalidates the affected tags AND paths. <code>app/blog/page.tsx</code> also has <code>export const revalidate = 30</code> as a worst-case ISR backstop.</p>",
    publishedAt: new Date().toISOString(),
    author: { name: "Zwingd" },
  },
];
