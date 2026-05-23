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
import { CMS_BASE, CMS_TENANT_REALM } from "./env";
import type { BlogPost } from "./types";

const realm = CMS_TENANT_REALM;
const listTag = `${realm}:blog-post:list`;
const detailTag = (slug: string) => `${realm}:blog-post:${slug}`;

async function cmsFetch<T>(path: string, tags: string[]): Promise<T | null> {
  if (!CMS_BASE) return null;
  try {
    const url = `${CMS_BASE}${path}`;
    const res = await fetch(url, {
      headers: { realm, accept: "application/json" },
      next: { tags },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // CMS unreachable (DNS, network, misconfigured CMS_BASE). The empty
    // state in `app/blog/page.tsx` handles both "no posts" and
    // "CMS-unreachable" identically — intentional UX.
    return null;
  }
}

export async function getBlogIndex(): Promise<BlogPost[]> {
  // cms-backend delivery returns `{ data: [...], meta: { total } }` (Strapi
  // v5 flat shape). Older docs / a different mapper may expose `items`.
  // Tolerant of both, plus the raw-array fallback.
  const data = await cmsFetch<
    { data?: BlogPost[]; items?: BlogPost[] } | BlogPost[]
  >("/api/v1/blog?limit=20&order=publishedAt:desc", [listTag]);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data ?? data.items ?? [];
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  return await cmsFetch<BlogPost>(`/api/v1/blog/${slug}`, [
    detailTag(slug),
    listTag,
  ]);
}
