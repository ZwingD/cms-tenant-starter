// lib/cms/site-chrome/normalize-footer-chrome.ts
/**
 * Unwrap the site-chrome footer delivery envelope into a flat, total
 * `FooterChrome`, discarding anything malformed.
 *
 * Why this is a separate module from the fetcher: the storefront test runner is
 * node-only with no DOM (`vitest.config.ts` -> `environment: "node"`, and its
 * `include` globs collect `.ts` only), so the shape logic has to live outside
 * the React component to carry unit coverage. It is also where the bugs would
 * be -- the fetcher is a thin `cmsFetch` delegation.
 *
 * Why it is this defensive: `ConfigDeliveryService.getFooter` serves the stored
 * `footerConfig` JSONB VERBATIM with no re-validation. Two writers touch that
 * column (the normalized admin path validated by `FooterConfigSchema`, and the
 * raw Strapi migration script that bypasses it), so the storefront cannot
 * assume the blob matches the Zod schema. Everything here degrades to an empty
 * slot rather than throwing: the footer must never break the page.
 *
 * Introduced: CMS-driven footer.
 * Plan: cms-backend/docs/plans/2026-08-12-platform-footer-tenant-onboarding.md Task 2
 */
import type {
  FooterChrome,
  FooterLegalLink,
  FooterSocialLink,
} from "./types";

/** Narrow `unknown` to a plain (non-array, non-null) object. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A non-empty string, or `null` if the value is anything else. */
function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/**
 * Link destinations we are willing to put in an `<a href>`: absolute http(s),
 * mailto, same-page anchors, and root-relative paths. `/(?!\/)` excludes
 * protocol-relative `//host`, which is an off-site destination wearing a
 * relative path's clothes.
 */
const SAFE_HREF_SCHEME = /^(?:https?:\/\/|mailto:|#|\/(?!\/))/i;

/**
 * A non-empty href whose scheme is on the allowlist, else `null`.
 *
 * SECURITY - trust boundary. These values are rendered straight into
 * `<a href={...}>`, and React does NOT sanitize href. Nothing upstream stops a
 * `javascript:` URI either: `LinkSchema` is a bare `z.string().min(1).max(2048)`
 * (it has to allow relative paths, so it cannot use `z.url()`), so a hostile
 * href survives the VALIDATED admin write path -- and the raw Strapi migration
 * writer bypasses Zod altogether. Without this check a CMS operator, or anyone
 * who can write that JSONB column, gets stored XSS on every page of the site,
 * since the footer is in the root layout.
 *
 * Allowlist rather than blocklist on purpose: obfuscations like `java\tscript:`
 * or `  javascript:` defeat substring blocklists, but simply fail to match a
 * positive scheme test.
 */
export function safeHref(value: unknown): string | null {
  const href = nonEmptyString(value);
  if (!href) return null;
  return SAFE_HREF_SCHEME.test(href.trim()) ? href : null;
}

function toSocialLink(entry: unknown): FooterSocialLink | null {
  if (!isPlainObject(entry)) return null;
  const platform = nonEmptyString(entry.platform);
  const href = safeHref(entry.href);
  // Both are load-bearing: `platform` is the link's accessible name and `href`
  // its destination, so an entry missing either renders as a broken link.
  return platform && href ? { platform, href } : null;
}

function toLegalLink(entry: unknown): FooterLegalLink | null {
  if (!isPlainObject(entry)) return null;
  const label = nonEmptyString(entry.label);
  const href = safeHref(entry.href);
  if (!label || !href) return null;
  return { label, href, openInNewTab: entry.openInNewTab === true };
}

/** Map an unknown value over a mapper, keeping only entries that survive. */
function compactMap<T>(value: unknown, map: (entry: unknown) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(map).filter((entry): entry is T => entry !== null);
}

/**
 * Flatten `GET /api/v1/site-chrome/footer` into the render shape.
 *
 * Accepts `unknown` rather than `FooterChromeEnvelope` because the caller hands
 * over whatever the CMS returned -- typing the parameter would assert a shape
 * this function exists to stop trusting.
 */
export function normalizeFooterChrome(raw: unknown): FooterChrome {
  const empty: FooterChrome = {
    socialLinks: [],
    legalLinks: [],
    copyright: "",
  };

  if (!isPlainObject(raw)) return empty;
  const data = raw.data;
  if (!isPlainObject(data)) return empty;
  const footer = data.footer;
  if (!isPlainObject(footer)) return empty;
  // `data.footer.data` is null for a realm with no site-settings row.
  const entity = footer.data;
  if (!isPlainObject(entity)) return empty;
  const attributes = entity.attributes;
  if (!isPlainObject(attributes)) return empty;

  return {
    socialLinks: compactMap(attributes.socialLinks, toSocialLink),
    legalLinks: compactMap(attributes.legalLinks, toLegalLink),
    copyright: nonEmptyString(attributes.copyright) ?? "",
  };
}
