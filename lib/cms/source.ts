// lib/cms/source.ts
/**
 * Blog reader — fetches from cms-backend OR falls back to baked-in
 * sample articles depending on `CMS_BLOG_SOURCE`.
 *
 * The CMS branch attaches `next: { tags: [...] }` to every fetch — that's
 * what makes tag-based revalidation work end-to-end. Without those tags,
 * the dual-tag handler in @zwingd-ce/cms-revalidate-nextjs has nothing to
 * invalidate (this was the L-10 race we resolved during the feezy.one
 * cutover — see the package README for the failure-mode table).
 */
import { CMS_BASE, CMS_TENANT_REALM, blogSource } from "./env";
import type { BlogPost } from "./types";
import { sampleArticles } from "../../app/blog/_static/articles";

const realm = CMS_TENANT_REALM;
const listTag = `${realm}:blog-post:list`;
const detailTag = (slug: string) => `${realm}:blog-post:${slug}`;

async function cmsFetch<T>(path: string, tags: string[]): Promise<T | null> {
  const url = `${CMS_BASE}${path}`;
  const res = await fetch(url, {
    headers: { realm, accept: "application/json" },
    next: { tags },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function getBlogIndex(): Promise<BlogPost[]> {
  if (blogSource() === "STATIC") return sampleArticles;
  const data = await cmsFetch<{ items?: BlogPost[] } | BlogPost[]>(
    "/api/v1/blog?limit=20&order=publishedAt:desc",
    [listTag],
  );
  if (!data) return sampleArticles; // graceful fallback if CMS is down
  return Array.isArray(data) ? data : (data.items ?? []);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (blogSource() === "STATIC") {
    return sampleArticles.find((a) => a.slug === slug) ?? null;
  }
  return await cmsFetch<BlogPost>(`/api/v1/blog/${slug}`, [
    detailTag(slug),
    listTag,
  ]);
}
