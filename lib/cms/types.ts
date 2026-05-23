// lib/cms/types.ts
/**
 * Minimal shape the starter expects from the CMS delivery API.
 * Mirrors what cms-backend's /api/v1/blog and /api/v1/blog/<slug> return.
 * Extend or pick fields as your storefront grows.
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  contentHtml?: string;
  publishedAt: string;
  author?: { name?: string };
  category?: { name?: string };
}
