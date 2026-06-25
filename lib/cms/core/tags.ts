// lib/cms/core/tags.ts
/**
 * Realm-scoped Next Data Cache tag builders. These MUST match the tag shape
 * @zwingd-ce/cms-revalidate-nextjs emits on the write side (computeTags.ts:
 * `${realm}:${contentType}:${slug}` and `${realm}:${contentType}:list`) - a read
 * tag that doesn't match its write tag silently breaks revalidation.
 *
 * Introduced: genericization P3.
 */
export const listTag = (realm: string, type: string): string =>
  `${realm}:${type}:list`;

export const detailTag = (realm: string, type: string, slug: string): string =>
  `${realm}:${type}:${slug}`;
