# Changelog

## 0.2.0 — 2026-05-23

### Breaking changes

- **Removed `CMS_BLOG_SOURCE` env var.** The storefront now always reads
  blog content from cms-backend at runtime. Operators upgrading from
  0.1.0 should delete the variable from their Vercel project's
  environment.

### Changes

- `/blog` renders a friendly empty state ("No posts yet — author your
  first post in the Zwingd CMS admin →") when cms-backend returns no
  posts OR is unreachable. Previously rendered baked-in placeholder
  articles in STATIC mode.
- `lib/cms/source.ts` is now CMS-only. Returns `[]` on fetch error
  (network, non-2xx, malformed JSON) or empty payload — same UX as the
  "no posts yet" case.
- Renamed `app/blog/_static/articles.ts` → `_demo-articles.ts`. Kept
  in-tree as an opt-in local-dev fixture; not imported anywhere at
  runtime (tree-shaken out of the production bundle).
- README: Quick Start drops from 3 steps to 2 (the "flip
  `CMS_BLOG_SOURCE` to CMS" step is gone). Troubleshooting row updated
  to point at `CMS_BASE` / `CMS_TENANT_REALM` mismatch.

### Migration

Upgrading from 0.1.0:

1. Delete `CMS_BLOG_SOURCE` from your Vercel project's environment.
2. Redeploy.
3. The `/blog` page now reflects whatever cms-backend has — empty state
   if no posts are published, the list of posts otherwise.

## 0.1.0 — initial release

- Next.js 15 starter pre-wired to consume Zwingd CMS content + revalidate
  on edits via `@zwingd-ce/cms-revalidate-nextjs`.
- `CMS_BLOG_SOURCE` env flag toggled between baked-in static articles
  and live CMS reads.
