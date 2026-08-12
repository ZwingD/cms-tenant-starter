// lib/cms/core/cms-fetch.ts
/**
 * The CMS fetch core: send the `realm` header, attach realm-scoped
 * Next Data Cache tags, apply a phase-appropriate abort budget, and NEVER throw
 * -- return `null` on any non-OK / network / timeout so a committed static
 * fallback can take over. This is the once-and-only-once fetcher the blog +
 * course-landing + chrome readers share (generalized from the former inline
 * `source.ts` fetcher).
 *
 * Introduced: genericization P3.
 * Build/request budget split + degradation warning: CMS-driven footer follow-up.
 */
import { CMS_BASE } from "../env";

/**
 * Next sets `NEXT_PHASE` while `next build` runs. Value verified against the
 * installed package (`next/constants` -> `PHASE_PRODUCTION_BUILD`) and observed
 * in a real build, not assumed.
 */
const PHASE_PRODUCTION_BUILD = "phase-production-build";

/**
 * Request-time budget. A user is waiting, so a slow CMS must never hang the
 * page -- bail out fast and let the caller's fallback render.
 */
export const REQUEST_TIMEOUT_MS = 2000;

/**
 * Build-time budget.
 *
 * Build and request time have OPPOSITE requirements, and collapsing them into
 * one number is a real defect rather than a tuning nit. At build there is no
 * user waiting, and the cost of giving up early is not a slow page -- it is a
 * static artifact that PERMANENTLY lacks the content, served to every visitor
 * until something happens to revalidate it. A cold TLS handshake to a remote
 * CMS measured 2.73s against the old flat 2000ms budget, so a first build after
 * a container start would silently prerender a chrome-less page; a warm rebuild
 * of the same commit would not. That non-determinism is exactly what makes it
 * dangerous: it passes locally and fails on the deploy that matters.
 *
 * 15s is ~5x the worst latency measured and still well inside any CI/deploy
 * step budget.
 *
 * The cost, stated plainly: a CMS that HANGS (rather than refusing fast) now
 * blocks 15s per failed fetch instead of 2s, and failed fetches are not cached,
 * so a fully hung CMS can add a couple of minutes to a build. That is the right
 * trade -- a slow build is visible and recoverable, a silently chrome-less
 * deploy is neither -- but it is a real cost, not a free win. A refused or
 * DNS-failed CMS still fails in milliseconds and is unaffected.
 */
export const BUILD_TIMEOUT_MS = 15_000;

/** True while `next build` is prerendering. */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD;
}

/**
 * The abort budget for this call: an explicit caller value always wins,
 * otherwise the budget appropriate to the current phase.
 */
export function resolveTimeoutMs(explicitMs?: number): number {
  if (typeof explicitMs === "number") return explicitMs;
  return isBuildPhase() ? BUILD_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
}

export interface CmsFetchOptions {
  realm: string;
  tags: string[];
  /**
   * Override the abort budget. Omit it to get the phase-appropriate default
   * (`REQUEST_TIMEOUT_MS` serving traffic, `BUILD_TIMEOUT_MS` while building).
   */
  timeoutMs?: number;
}

export async function cmsFetch<T>(
  path: string,
  { realm, tags, timeoutMs }: CmsFetchOptions,
): Promise<T | null> {
  if (!CMS_BASE) return null;

  const budget = resolveTimeoutMs(timeoutMs);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budget);
  const startedAt = Date.now();

  try {
    const res = await fetch(`${CMS_BASE}${path}`, {
      headers: { realm, accept: "application/json" },
      signal: controller.signal,
      next: { tags },
    });
    if (!res.ok) {
      degraded(path, budget, startedAt, `HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    // Non-OK, DNS/network error, or abort (timeout): degrade to null so the
    // caller's static fallback / empty state renders -- never throw to the page.
    degraded(path, budget, startedAt, reasonOf(err));
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** A short, log-safe description of why a fetch failed. */
function reasonOf(err: unknown): string {
  if (err instanceof Error) {
    // An abort is the timeout firing -- name it as such, since "AbortError"
    // alone sends readers looking for a cancelled request.
    return err.name === "AbortError" ? "timed out" : err.message;
  }
  return String(err);
}

/**
 * Announce a degradation instead of swallowing it.
 *
 * Returning `null` is the intended contract -- the storefront must survive a
 * CMS outage. Doing it SILENTLY was the defect: a build whose chrome fetch
 * timed out produced a page with no footer, no error, and no warning, so the
 * only way to notice was to look at the deployed site. The null still happens;
 * it is simply no longer invisible.
 *
 * Build-phase failures are called out separately because their blast radius is
 * different: a request-time miss affects one response, a build-time miss is
 * baked into every visitor's page until a revalidation replaces it.
 */
function degraded(
  path: string,
  budget: number,
  startedAt: number,
  reason: string,
): void {
  const elapsed = Date.now() - startedAt;
  const where = isBuildPhase()
    ? "during build (this content will be MISSING from the prerendered page until a revalidation replaces it)"
    : "at request time (falling back for this response)";
  console.warn(
    `[cms-fetch] ${path} degraded to null ${where} -- ${reason} after ${elapsed}ms (budget ${budget}ms)`,
  );
}
