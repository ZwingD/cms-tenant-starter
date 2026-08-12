# Changelog

## Unreleased

### Changes

- **CMS-driven footer.** `app/layout.tsx` now server-fetches `Navigation(FOOTER)`
  and the site-chrome footer blob alongside the header nav (one parallel
  `Promise.all`) and renders `components/layout/Footer.tsx`. The hardcoded
  "Powered by" stub is gone. Link columns, social links, legal links and
  copyright all come from CMS configuration; every slot is independently
  conditional, so an unused slot renders nothing rather than an empty
  container. New reader at `lib/cms/site-chrome/`.

### Fixes

- **A cold `next build` could silently ship a page with no footer.** `cmsFetch`
  applied one flat 2000ms abort budget in every phase. That budget is right at
  request time (a user is waiting, so a slow CMS must never hang the page) but
  wrong at build time, where nobody is waiting and giving up early bakes missing
  content into a static artifact served to everyone until something revalidates
  it. A cold TLS handshake to the CMS measured 2.73s against that 2000ms budget,
  so a build would prerender a chrome-less page while a rebuild of the same
  commit would not — passing locally and failing on the deploy that matters. The
  budget is now phase-aware (`REQUEST_TIMEOUT_MS` 2s serving traffic,
  `BUILD_TIMEOUT_MS` 15s during `next build`, explicit caller values still win),
  and **every** degradation now logs a warning naming the path, phase,
  consequence, reason and elapsed time instead of returning `null` in silence.
  Returning `null` is still the contract — the storefront survives a CMS outage —
  it is just no longer invisible.

- **Header navigation never revalidated.** `fetchNavigation` subscribed to
  `${realm}:navigation:list`, but `navigation` is a *singleton* on the write
  side — `@zwingd-ce/cms-revalidate-nextjs` busts `${realm}:navigation` and
  `${realm}:layout`, never a `:list` tag. The read tag matched nothing the
  webhook emits, so a navigation edit never invalidated the cached header. Adds
  `singletonTag()` / `layoutTag()` to `lib/cms/core/tags.ts` and moves the nav
  and footer reads onto them. (The existing test asserted the wrong tag and had
  codified the bug; the README already documented the correct contract.)

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
