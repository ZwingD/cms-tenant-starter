# Changelog

## 0.3.0 — 2026-06-25

### Changes

- **Course-landing rendering from the generic archetype model.** New
  `/courses/[code]` route renders a page built entirely from generic
  `archetype` + `inline.<variant>` sections through an archetype+variant-keyed
  renderer registry (`components/sections`) — no per-page templates. Unknown
  archetypes/variants render an `UnknownSection` placeholder instead of
  crashing the page.
- **cms-client-shaped read layer.** Added `lib/cms/core` (`cmsFetch` with
  realm header + cache tags + timeout + null-on-error; `envelope` Strapi-v4 ↔
  native adapter; shared `listTag`/`detailTag`) and `lib/cms/course-landing`
  (archetype view models + `fetchCourseLanding`). Structured for later
  extraction into the shared `@zwingd-ce/cms-client` package.
- `lib/cms/source.ts` (blog reader) refactored onto `core/` — same signatures,
  same tag keys, blog behavior unchanged.
- **Distinct reference theme** ("Meridian Institute": deep navy + gold accent +
  serif display face) via `tailwind.config.ts` semantic tokens — re-skin the
  whole storefront with a token edit, no component changes.
- A "Courses" nav link added to the layout.

### Notes

- **Fixture-driven pending P4.** `fetchCourseLanding` consumes a live
  archetype-shaped delivery body when served, but the generic delivery endpoint
  is not wired yet (P4 in the section-model genericization PRD). Until then
  `/courses/[code]` falls back to the committed reference fixture; the code path
  goes live unchanged once P4 serves archetype payloads.

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
