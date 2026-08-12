// lib/cms/core/tags.ts
/**
 * Realm-scoped Next Data Cache tag builders. These MUST match the tag shape
 * @zwingd-ce/cms-revalidate-nextjs emits on the write side (computeTags.ts:
 * `${realm}:${contentType}:${slug}` and `${realm}:${contentType}:list`) - a read
 * tag that doesn't match its write tag silently breaks revalidation.
 *
 * Two FAMILIES, and picking the wrong one is a silent failure:
 *
 *   - Slug-bearing types (blog-post, course-landing, page ...) -> `detailTag`
 *     for the item and `listTag` for any index that renders it. The webhook
 *     emits BOTH on a write.
 *   - Singleton types (navigation, site-settings) -> `singletonTag` plus
 *     `layoutTag`. computeTags.ts routes these through its SINGLETONS branch,
 *     which emits a BARE `${realm}:${type}` and `${realm}:layout` - and no
 *     `:list` tag at all. A singleton read subscribed via `listTag` therefore
 *     names a tag nothing ever busts, and the content goes stale forever with
 *     no error anywhere. Reach for `singletonTag` whenever the CMS surface is
 *     one-per-realm rather than one-per-slug.
 *
 * Introduced: genericization P3. Singleton builders added for the CMS-driven
 * footer (docs/plans/2026-08-12-platform-footer-tenant-onboarding.md Task 1).
 */
export const listTag = (realm: string, type: string): string =>
  `${realm}:${type}:list`;

export const detailTag = (realm: string, type: string, slug: string): string =>
  `${realm}:${type}:${slug}`;

/** Bare tag for a one-per-realm CMS surface ("navigation", "site-settings"). */
export const singletonTag = (realm: string, type: string): string =>
  `${realm}:${type}`;

/**
 * The realm's layout tag. Every singleton write busts it, so a layout-level
 * fetch (header, footer, site-wide SEO) can subscribe to this ONE tag instead
 * of enumerating every singleton it depends on.
 */
export const layoutTag = (realm: string): string => `${realm}:layout`;
