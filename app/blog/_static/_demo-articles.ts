// app/blog/_static/_demo-articles.ts
/**
 * Demo article fixtures — OPT-IN, local-dev ONLY. Not imported at runtime.
 *
 * From v0.2.0 onward the storefront always reads blog content from
 * cms-backend (see `lib/cms/source.ts`); when the CMS has no posts or is
 * unreachable, `app/blog/page.tsx` renders an honest empty state.
 *
 * Keep this file as a reference shape / convenience fixture you can
 * `import { sampleArticles } from "./_static/_demo-articles"` from a
 * scratch page during local dev. Anything imported here is tree-shaken
 * out of the production bundle because no runtime path references it.
 *
 * Safe to delete once you've published a few real posts.
 */
import type { BlogPost } from "../../../lib/cms/types";

export const sampleArticles: BlogPost[] = [
  {
    id: "demo-1",
    slug: "welcome",
    title: "Welcome to your new tenant site",
    excerpt:
      "Demo article — not served at runtime. Author real posts in the Zwingd CMS admin to populate the live /blog index.",
    contentHtml:
      "<p>This file is a local-dev convenience fixture. The production storefront fetches blog posts live from cms-backend.</p>",
    publishedAt: new Date().toISOString(),
    author: { name: "Zwingd" },
  },
  {
    id: "demo-2",
    slug: "how-revalidation-works",
    title: "How revalidation works in this starter",
    excerpt:
      "On every CMS edit, cms-backend POSTs a signed webhook to /api/revalidate. The handler invalidates both the detail tag and the list tag.",
    contentHtml:
      "<p>The starter ships with <code>@zwingd-ce/cms-revalidate-nextjs</code>. The handler verifies HMAC, then revalidates the affected tags AND paths. <code>app/blog/page.tsx</code> also has <code>export const revalidate = 30</code> as a worst-case ISR backstop.</p>",
    publishedAt: new Date().toISOString(),
    author: { name: "Zwingd" },
  },
];
