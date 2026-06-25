// lib/cms/source.ts
/**
 * Blog reader — always fetches from cms-backend (CMS is the only source of
 * truth post-v0.2.0). On fetch error or empty result, returns `[]` so the
 * page renders an honest empty state instead of placeholder content.
 *
 * The CMS branch attaches `next: { tags: [...] }` to every fetch — that's
 * what makes tag-based revalidation work end-to-end. Without those tags,
 * the dual-tag handler in @zwingd-ce/cms-revalidate-nextjs has nothing to
 * invalidate (this was the L-10 race we resolved during the feezy.one
 * cutover — see the package README for the failure-mode table).
 */
import { CMS_TENANT_REALM } from "./env";
import { cmsFetch } from "./core/cms-fetch";
import { listTag, detailTag } from "./core/tags";
import type { BlogPost } from "./types";

const realm = CMS_TENANT_REALM;

export async function getBlogIndex(): Promise<BlogPost[]> {
  // cms-backend delivery returns `{ data: [...], meta: { total } }` (Strapi
  // v5 flat shape). Older docs / a different mapper may expose `items`.
  // Tolerant of both, plus the raw-array fallback.
  const data = await cmsFetch<
    { data?: BlogPost[]; items?: BlogPost[] } | BlogPost[]
  >("/api/v1/blog?limit=20&order=publishedAt:desc", {
    realm,
    tags: [listTag(realm, "blog-post")],
  });
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data ?? data.items ?? [];
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  // Pass BOTH the detail tag AND the list tag so a post edit revalidates the
  // index too (the dual-tag contract @zwingd-ce/cms-revalidate-nextjs relies on).
  return await cmsFetch<BlogPost>(`/api/v1/blog/${slug}`, {
    realm,
    tags: [detailTag(realm, "blog-post", slug), listTag(realm, "blog-post")],
  });
}
