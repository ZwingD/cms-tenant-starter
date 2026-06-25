// lib/cms/core/cms-fetch.ts
/**
 * The CMS fetch core: send the `realm` header, attach realm-scoped
 * Next Data Cache tags, time out at ~2s, and NEVER throw -- return `null` on any
 * non-OK / network / timeout so a committed static fallback can take over. This
 * is the once-and-only-once fetcher the blog + course-landing readers share
 * (generalized from the former inline `source.ts` fetcher).
 *
 * Introduced: genericization P3.
 */
import { CMS_BASE } from "../env";

export interface CmsFetchOptions {
  realm: string;
  tags: string[];
  /** Abort budget; the storefront must never hang on a slow CMS. */
  timeoutMs?: number;
}

export async function cmsFetch<T>(
  path: string,
  { realm, tags, timeoutMs = 2000 }: CmsFetchOptions,
): Promise<T | null> {
  if (!CMS_BASE) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${CMS_BASE}${path}`, {
      headers: { realm, accept: "application/json" },
      signal: controller.signal,
      next: { tags },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Non-OK, DNS/network error, or abort (timeout): degrade to null so the
    // caller's static fallback / empty state renders -- never throw to the page.
    return null;
  } finally {
    clearTimeout(timer);
  }
}
