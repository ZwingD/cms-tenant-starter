# P3 — Storefront Renderer Registry + Reference Site Implementation Plan

Created: 2026-06-25
Author: abhi@convertedgetech.com
Agent: Claude Code
Status: VERIFIED
Approved: Yes
Iterations: 0
Worktree: No
Type: Feature

## Summary

**Goal:** A `cms-tenant-starter` reference storefront renders a course-landing page from generic `archetype`+`variant` payloads — through a renderer registry + a distinctly-themed design — proving a tenant page can be built entirely from the generic model.

## Out of Scope

- **Live archetype delivery from the CMS.** The BE still emits the legacy Strapi-compat envelope; native archetype delivery (`delivery-adapter.ts` native path) is **P4/P7**. P3 renders against the archetype **contract** using a committed fixture (the read layer's static-fallback); the live-fetch path is wired but inert until P4 serves archetype payloads. **No `cms-backend` change in P3.**
- **Extracting the `@zwingd-ce/cms-client` package.** P3 builds the read layer *inline* in `cms-tenant-starter` following the package's `core/envelope/` + `course-landing/` design (`.workspace/docs/cms-client-package-scope.md`), structured for later extraction. Building/publishing the shared package is its own parallel initiative.
- **Non-course-landing content types** (chrome/pages/taxonomy/collections/single-types). P3's read layer covers `core` + `course-landing` only; the existing blog path is refactored onto `core` but otherwise unchanged.
- **A second tenant / onboarding flow.** Standing up the reference *tenant* (realm + theme + content end-to-end) is P4. P3 ships the rendering machinery + one themed sample page.

## Approach

**Chosen:** Three-layer storefront stack, all in `cms-tenant-starter` (no BE, no shared package): (1) an inline cms-client-shaped read layer — `lib/cms/core/` (fetch + Strapi-v4↔native envelope adapter + realm-scoped tags) + `lib/cms/course-landing/` (fetch→view-model with a static fixture fallback), refactoring the naive blog `source.ts` onto the core; (2) an `archetype`+`variant`-keyed **renderer registry** (`components/sections/`) resolving a section to a component (variant → archetype → placeholder); (3) a distinctly-themed reference course page (`app/courses/[code]`) composing the sections via the registry + theme tokens.
**Why:** single-repo and unblocked by both live delivery (P4) and the package initiative, while the `core/envelope/` seam is exactly where P7's native cutover flips later — at the cost of a committed fixture standing in for live content until P4 swaps it.

## Context for Implementer

- **The archetype contract = `cms-backend/src/course-landing/dto/archetypes.ts`** (the native shape P4/P7 delivery will emit). The view models mirror it FIELD-FOR-FIELD (this is the drift gate): `Hero{header?,media?,ctas?,ratings?,stats?,badges?,meta?}`, `Collection{header?,items?,cta?,meta?}`, `People{header?,people?,meta?}`, `StatBand{header?,stats?,meta?}`, `DynList{header?,source,meta?}` — **NOTE: DynList has NO `items` (catalog-backed, items resolved server-side; P3 renders only the `source.query` framing)**; `Inline` (variants `quote|image|divider|spacer|cta|card|custom`). Primitives: `Cta{label,href,action?,variant?,icon?,file?,openInNewTab?}`, `Rating`, `Header{eyebrow?,heading,subheading?}`, `Stat{value,label?,icon?}`, `Person{name,designation?,image?,about?,socials?,meta?}`, `CollectionItem{title?,body?,icon?,image?,meta?}`, `Badge{label?,image?}`, and `MediaRef` (`{mediaId?,url?,altText?,…}` → storefront resolves to `{url,alt}`). **`meta?: Record<string,unknown> | null`** is an adapter-internal provenance bag (adminHidden, excluded from the served admin schema) — the view models carry it as an OPTIONAL passthrough so the tolerant adapter never drops a delivered field, but the renderers IGNORE it. The 12 served admin-schema keys (FE bundle `Zwingd_frontend_V2/apps/zwingd/components/cms/SectionEditors/generated/admin-archetype-schemas.json`) are the field-name reference.
- **Forward-compat / crash-proof boundary:** delivered sections may include an archetype the storefront doesn't know (a future P4/P7 addition). So `sections` is typed `(Archetype | UnknownArchetype)[]` where `UnknownArchetype = { archetype: string; variant?: string }`, and the FE envelope adapter is **tolerant** — it does a STRUCTURAL map (NOT a Zod `ArchetypeSchema.parse`, which is BE-only and would throw on an unknown discriminator); an unrecognized archetype passes through as `{archetype, variant}` and the registry renders `UnknownSection`. The storefront never throws on a CMS shape wobble (the never-throw contract).
- **Read-layer source of truth:** `.workspace/docs/cms-client-package-scope.md` §4 (architecture) + §5 (shared vs per-tenant boundary). Build only `core/` + `course-landing/`; the static-fallback arg (§4) is the per-tenant fixture seam P3 uses and P4 keeps.
- **The `cmsFetch` core already exists** (naive, inline) in `lib/cms/source.ts:20` — extract + generalize it (realm header, `next:{tags}`, ~2s timeout, **never throw → return `null`**), don't rewrite from scratch. The tag convention must match `@zwingd-ce/cms-revalidate-nextjs` (`${realm}:${contentType}:${slug}` / `:list`) — already used at `source.ts:17`.
- **No test framework yet** — P3 adds `vitest` (node env, no jsdom) for the pure logic (envelope adapter, view-model map, registry resolver); section components are verified by the browser E2E. Mirrors the FE CMS test posture.

## Runtime Environment

- **Storefront (public, NO auth):** `cd cms-tenant-starter && pnpm install && pnpm dev` → `http://localhost:3000`. The reference page is `/courses/<code>`. Type-check `pnpm type-check`; tests `pnpm test` (vitest, added in Task 1); build `pnpm build`.
- Browser E2E runs against the local dev server directly (no auth gate, no CDP-attach needed) — `playwright-cli` headless.

## Assumptions

- The archetype native delivery shape P4/P7 emits equals the `dto/archetypes.ts` objects with `MediaRef` resolved to a URL. Tasks 2–4 build the view models + renderers against that shape; the Task-1 envelope adapter's native-input test pins the contract. If P4's actual native envelope differs, the envelope adapter (one file) absorbs it — the registry + components stay put.

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| The read-core refactor breaks the existing blog path | Low | Med | `getBlogIndex`/`getBlogPost` keep their signatures + tag keys; TS-003 regression scenario renders the blog; the core's never-throw→`null` contract is unit-tested |
| Renderer registry crashes the whole page on an unknown/missing archetype or variant | Med | Med | Resolver falls back variant→archetype→`UnknownSection` placeholder (never throws); a unit test covers the miss path; TS-002 exercises it live |
| Fixture drifts from the real archetype contract, so P3 renders a shape P4 won't deliver | Med | Med | The fixture is typed against the Task-2 view models (which mirror `dto/archetypes.ts`); a `tsc` error is the drift signal; the envelope adapter test asserts the native-input → view-model mapping |

## Goal Verification

### Truths

1. A reference course page renders ≥4 archetypes (Hero + Collection + People + StatBand) from an archetype-contract payload through the renderer registry + a visibly-distinct (non-Techademy) theme — a tenant course page built entirely from the generic model.
2. The storefront read layer is cms-client-shaped (`core/` fetch+envelope+tags + `course-landing/` fetch with a static fixture fallback) and replaces the naive blog `source.ts` without breaking the blog — structured for later extraction into `@zwingd-ce/cms-client`.

## E2E Test Scenarios

### TS-001: Reference course page renders archetype sections
**Priority:** Critical
**Preconditions:** `pnpm dev` running; no CMS env set (so the read layer uses the committed fixture fallback).
**Mapped Tasks:** Task 2, Task 3, Task 4, Task 5

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/courses/<reference-code>` | Page renders (200), distinct theme applied (non-default colors/font visible) |
| 2 | Read the page | A **Hero** (heading + CTA), a **Collection** (header + ≥2 items), a **People** block (≥1 person), and a **StatBand** (≥2 stats) all render with content from the fixture |
| 3 | Inspect a CTA link | The Hero CTA renders as an `<a href>` from the fixture's `ctas[0]` |

### TS-002: Unknown archetype/variant degrades gracefully
**Priority:** High
**Preconditions:** `pnpm dev` running.
**Mapped Tasks:** Task 3

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/courses/<reference-code>` whose fixture includes the unregistered object archetype `{archetype:'custom-block',variant:'demo'}` | The page still renders; that section shows the `UnknownSection` placeholder ("Unsupported section: custom-block/demo") — not a blank page, not a crash/500 |

### TS-003: Blog path still works after the read-core refactor
**Priority:** High
**Preconditions:** `pnpm dev` running.
**Mapped Tasks:** Task 1

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/blog` | The blog index renders (empty-state when no CMS configured — identical to today), no error |

## Progress Tracking

- [x] Task 1: Read core (fetch + envelope + tags) + vitest harness + blog refactor
- [x] Task 2: Course-landing view models + fetch (static-fallback) + reference fixture
- [x] Task 3: Archetype+variant renderer registry + resolver
- [x] Task 4: Section components (Hero/Collection/People/StatBand/DynList/Inline)
- [x] Task 5: Distinct theme + reference course page + nav
- [x] Task 6: Doc-sync (README + CHANGELOG)

## Implementation Tasks

### Task 1: Read core (fetch + envelope + tags) + vitest harness + blog refactor

**Objective:** Extract the inline `cmsFetch` from `source.ts` into a reusable `lib/cms/core/` (fetch with realm header + `next:{tags}` + ~2s timeout + never-throw→`null`; realm-scoped tag builders; a Strapi-v4↔native envelope adapter that resolves `MediaRef`→`{url,alt}`), add a `vitest` harness, and refactor the blog readers onto the core (unchanged behavior).

**Files:**

- Create: `lib/cms/core/cms-fetch.ts`, `lib/cms/core/tags.ts`, `lib/cms/core/envelope.ts`
- Create: `lib/cms/course-landing/types.ts` (the `Archetype` view-model union — ships HERE because `envelope.ts` imports it; Task 2 adds the fetch + fixture on top)
- Modify: `lib/cms/source.ts` (blog readers call `cmsFetch` from core), `package.json` (add `vitest` devDep + `"test": "vitest run"`)
- Create: `vitest.config.ts`
- Test: `lib/cms/core/envelope.test.ts`

**Key Decisions / Notes:**

- **Resolve the ordering up front:** `lib/cms/course-landing/types.ts` (the `Archetype | UnknownArchetype` union + `CourseLandingView` + `BadgeView`) is created in THIS task because `envelope.ts` returns `(Archetype | UnknownArchetype)[]`. Mirror `cms-backend/src/course-landing/dto/archetypes.ts` field-for-field incl. the `meta?` bag on every object archetype + `Hero.badges?: BadgeView[]`; `DynList` has NO `items` (only `source{query,limit?}`). `UnknownArchetype = { archetype: string; variant?: string }`.
- `cmsFetch(path, {realm, tags, timeoutMs=2000})`: generalize `source.ts:20` — add an `AbortController` ~2s timeout; keep the `!res.ok`/`catch`→`null` contract verbatim (the never-throw invariant the blog + course-landing both rely on).
- `tags.ts`: `listTag(realm, type)` / `detailTag(realm, type, slug)` returning `${realm}:${type}:list` / `${realm}:${type}:${slug}` — must match `@zwingd-ce/cms-revalidate-nextjs` `computeTags.ts` (`${realm}:${contentType}:${slug}` / `:list`; current literal `source.ts:17`). **`getBlogPost` MUST keep passing BOTH tags** — `[detailTag(realm,'blog-post',slug), listTag(realm,'blog-post')]` (`source.ts:51-53`) — so list-revalidation of a post is preserved.
- `envelope.ts`: `toNativeSections(raw): (Archetype | UnknownArchetype)[]` — accepts a native `{sections:[…]}`/array OR a Strapi-v4-wrapped response; returns native archetype objects with each `MediaRef` (`{data:{attributes:{url}}}` v4 OR `{url}` native) resolved to `{url,alt}`. **TOLERANT structural map — NOT a Zod `ArchetypeSchema.parse`** (that is BE-only and throws on an unknown discriminator): a section whose `archetype` is unrecognized passes through as `{archetype, variant}` (an `UnknownArchetype`), never dropped, never thrown. This is the P7 cutover seam — keep it the ONLY place that knows the wire envelope.
- `vitest.config.ts`: `environment: 'node'`, `include: ['lib/**/*.test.ts','components/**/*.test.ts']`. Add `vitest` to devDependencies.
- New `lib/cms/**` files carry a top-of-file purpose comment matching the existing repo style (`source.ts`/`env.ts` headers) — there is no `cms-tenant-starter/CLAUDE.md`, so the cms-backend teaching-comment standard does NOT apply; match the starter's lightweight existing style, don't import the BE standard.
- `Trivial:` does NOT apply (new public functions + new envelope logic + new test harness).

**Definition of Done:**

- [ ] `cmsFetch` returns `null` (never throws) on `!res.ok`, network error, AND timeout (test mocks `fetch` for each); a success returns the parsed body.
- [ ] `envelope.toNativeSections` maps a Strapi-v4-wrapped sample AND a native sample to the same archetype objects (`MediaRef`→`{url,alt}` in both), and passes an unrecognized-`archetype` section through as `{archetype,variant}` WITHOUT throwing.
- [ ] `getBlogIndex`/`getBlogPost` keep their signatures + tag keys (incl. `getBlogPost`'s dual detail+list tags) and still return `[]`/`null` on no-CMS (blog behavior unchanged).
- [ ] Verify (run AFTER `course-landing/types.ts` exists, created in this task): `cd cms-tenant-starter && pnpm test && pnpm type-check`

### Task 2: Course-landing view models + fetch (static-fallback) + reference fixture

**Objective:** Define the archetype view-model types (mirroring `dto/archetypes.ts`), a `fetchCourseLanding(code, {fallback})` that fetches via the core + envelope and falls back to a committed fixture when the CMS returns nothing (the P3 path; P4 swaps live content in), and the reference course fixture exercising ≥4 archetypes + ≥1 inline.

**Files:**

- Modify: `lib/cms/course-landing/types.ts` (created in Task 1 — Task 2 only adds the `CourseLandingView` accessor types if not already present)
- Create: `lib/cms/course-landing/fetch-course-landing.ts`
- Create: `lib/cms/course-landing/_fixtures/reference-course.ts`
- Test: `lib/cms/course-landing/fetch-course-landing.test.ts`

**Key Decisions / Notes:**

- `types.ts` ships in Task 1 (the `Archetype | UnknownArchetype` union + `CourseLandingView{code, sections: (Archetype|UnknownArchetype)[]}` + `BadgeView`). It mirrors `dto/archetypes.ts` field-for-field INCL. `meta?` on every object archetype + `Hero.badges?: BadgeView[]`, with `MediaRef`→`{url,alt}` and `variant: string`. This is THE drift gate (tsc fails if the fixture diverges).
- `fetch-course-landing.ts`: `fetchCourseLanding(code, {fallback})` → `cmsFetch('/api/v1/course-landings/by-code/<realm>/<code>', [detailTag(realm,'course-landing',code)])` then `envelope.toNativeSections`; on `null`/empty OR a non-archetype (legacy) shape, return `fallback`. In P3 the live path returns the legacy envelope (no archetype sections) so the fallback always wins — documented; P4's archetype delivery makes the live path live.
- `reference-course.ts`: a typed `CourseLandingView` for a synthetic reference tenant — Hero (heading + 2 ctas + 1 stat + **1 badge** + a `meta` bag to prove passthrough), Collection (header + 3 items), People (2 people), StatBand (3 stats), 1 `inline.quote`, AND one **unregistered OBJECT archetype** `{ archetype: 'custom-block', variant: 'demo' }` (typed as `UnknownArchetype` — a realistic future P4/P7 archetype the storefront doesn't know; drives TS-002). NOT an unknown inline variant (Inline is a fixed discriminated union — an unknown inline variant can't be typed). Believable non-Techademy copy.
- `Trivial:` does NOT apply (new fetch logic + fixture).

**Definition of Done:**

- [ ] `fetchCourseLanding` returns the fixture when `cmsFetch` resolves `null` (test mocks core→null) AND when it resolves a legacy (non-archetype) shape; returns mapped native sections when given an archetype-shaped delivery body.
- [ ] The fixture type-checks against `CourseLandingView` (tsc green), contains ≥4 distinct object archetypes (Hero+Collection+People+StatBand) + an `inline.quote` + one `UnknownArchetype` (`custom-block`) section, and the Hero exercises `badges` + a `meta` passthrough.
- [ ] Verify: `cd cms-tenant-starter && pnpm test && pnpm type-check`

### Task 3: Archetype+variant renderer registry + resolver

**Objective:** Build the `archetype`+`variant`-keyed renderer registry that maps a section to its React component, resolving `archetype.variant` → `archetype` → an `UnknownSection` placeholder, so an unregistered shape degrades gracefully instead of crashing.

**Files:**

- Create: `components/sections/registry.tsx`, `components/sections/UnknownSection.tsx`
- Test: `components/sections/registry.test.ts`

**Key Decisions / Notes:**

- `registry.tsx`: `SECTION_REGISTRY: Record<string, FC<{section: Archetype}>>` keyed by `archetype` (object archetypes) + `inline.<variant>` (each inline variant). The registry value takes the FULL `Archetype` union; each component narrows INTERNALLY (`const s = section as HeroView` — SAFE by construction because the registry key guarantees the archetype; the `Inline` component does `section as InlineView` then `switch(s.variant)` which TS narrows on the literal discriminator). **No `as unknown` / no double-cast** — the key→type guarantee is the only narrowing.
- `resolveRendererKey(section: { archetype: string; variant?: string }): string` — pure + exported; takes the STRUCTURAL `{archetype, variant?}` (so it tolerates an `UnknownArchetype`): `inline` → `inline.${variant}`; object archetype → `archetype`; if the key isn't in the registry → the `UnknownSection` sentinel. `registry.test.ts` asserts resolution + the unknown fallback in node env without rendering React. `<SectionList sections={…}/>` maps each section through the resolved component (component imports wired from Task 4).
- `UnknownSection.tsx`: a muted, non-crashing placeholder ("Unsupported section: <archetype>/<variant>") — dev-visible, never throws.
- `Trivial:` does NOT apply (new resolution logic + new public registry).

**Definition of Done:**

- [ ] `resolveRendererKey` returns `hero` for a hero section, `inline.quote` for an inline quote, and the `UnknownSection` sentinel for the unregistered OBJECT archetype `{archetype:'custom-block',variant:'demo'}`.
- [ ] `<SectionList>` renders every fixture section without throwing, substituting `UnknownSection` for the `custom-block` one (asserted live in the Task-5 browser E2E TS-002).
- [ ] `pnpm type-check` passes with NO `as unknown` cast in `registry.tsx` or the resolver (the union narrowing is safe-by-key).
- [ ] Verify: `cd cms-tenant-starter && pnpm test && pnpm type-check`

### Task 4: Section components (Hero/Collection/People/StatBand/DynList/Inline)

**Objective:** Implement the themed section renderers for the six archetypes (Inline handling its 7 variants via a switch), each consuming its typed view model + the theme tokens (Task 5), with the Hero/Collection/People/StatBand renderers rich enough to carry the demo and DynList/Inline functional.

**Files:**

- Create: `components/sections/Hero.tsx`, `components/sections/Collection.tsx`, `components/sections/People.tsx`, `components/sections/StatBand.tsx`
- Create: `components/sections/DynList.tsx`, `components/sections/Inline.tsx`

**Key Decisions / Notes:**

- Each component takes the full `{section: Archetype}` and narrows internally (`const s = section as HeroView`) — SAFE because the registry key guarantees the archetype (see Task 3); no `as unknown`. Server components. Use semantic Tailwind classes bound to the theme tokens (Task 5) — NO hardcoded hex (follow the storefront-design rules: distinctive type, intentional spacing, no AI-default 3-col-card cliché for Collection — vary the layout).
- `Hero`: header (eyebrow/heading/subheading) + `ctas[]` as buttons + optional `media[0]` + `stats`/`ratings`/`badges` strip (badges = `{label,image}` chips). `Collection`: header + `items[]` (title/body/icon/image) in an intentional layout (not identical shadowed cards). `People`: `people[]` (name/designation/image/about). `StatBand`: `stats[]` (value/label). `DynList`: render `header` + a framing line for `source.query` ONLY — **DynList has NO `items` field** (catalog-backed, server-resolved; P3 shows the framing, P4 wires the live list). `Inline`: `const s = section as InlineView; switch(s.variant)` over quote/image/divider/spacer/cta/card/custom. All renderers ignore the `meta` passthrough.
- Register all six in `components/sections/registry.tsx` (Task 3) — `inline.*` keys map to `Inline` with the variant.
- Performance: server components, no client JS; images via `next/image` where a `media.url` exists.
- `Trivial:` does NOT apply.

**Definition of Done:**

- [ ] Each of Hero/Collection/People/StatBand/DynList/Inline renders its view model without throwing on missing optional fields (e.g. a Hero with no `media`/`ratings`).
- [ ] No hardcoded hex colors in the components (theme tokens only); `pnpm lint` clean.
- [ ] Verify (rendering proven in TS-001): `cd cms-tenant-starter && pnpm type-check && pnpm lint`

### Task 5: Distinct theme + reference course page + nav

**Objective:** Apply a visibly-distinct (non-Techademy) theme via Tailwind tokens + a characterful font, add the `/courses/[code]` reference page that fetches the course landing (fixture in P3) and renders its sections through the registry, and link it from the nav.

**Files:**

- Modify: `tailwind.config.ts` (theme.extend: reference palette + font family), `app/globals.css` (CSS vars + base), `app/layout.tsx` (load the font via `next/font`, nav link)
- Create: `app/courses/[code]/page.tsx`

**Key Decisions / Notes:**

- Theme: a distinct identity — e.g. navy `#0B1F3A` primary + gold `#C8A04B` accent + warm paper background, a **characterful display font via `next/font/google`** (NOT Inter/Roboto/Arial — e.g. Fraunces/Newsreader for display + a clean neutral body) per the frontend-design rules. Define as Tailwind `theme.extend.colors` + `fontFamily` and CSS vars in `globals.css`; components consume `bg-primary`/`text-accent`/etc.
- `app/courses/[code]/page.tsx`: `const view = await fetchCourseLanding(params.code, { fallback: referenceCourse });` then `<SectionList sections={view.sections} />`. Server component. A 404 (`notFound()`) only if neither live nor fallback yields a view (won't happen in P3 — the fixture is always returned for the reference code).
- `layout.tsx`: add a "Courses" / reference nav link to `/courses/<reference-code>`; apply the font className to `<body>`. Keep the existing blog nav.
- `Trivial:` does NOT apply (new route + theme system).

**Definition of Done:**

- [ ] `/courses/<reference-code>` returns 200 and renders Hero+Collection+People+StatBand+inline from the fixture through the registry (TS-001).
- [ ] The unknown-variant fixture section renders `UnknownSection`, page does not 500 (TS-002).
- [ ] The theme is visibly non-default (navy/gold + the chosen display font present in the rendered page); `/blog` still renders (TS-003).
- [ ] Browser E2E TS-001/002/003 pass against `pnpm dev` (playwright-cli headless, no auth).
- [ ] Verify: `cd cms-tenant-starter && pnpm build && pnpm type-check`

### Task 6: Doc-sync (README + CHANGELOG)

**Objective:** Update the starter's README + CHANGELOG to document the new course-landing rendering path (the cms-client-shaped read layer + archetype renderer registry + the `/courses/[code]` reference page), so a tenant adopter knows the starter now renders generic archetype course pages, not just blog.

**Files:**

- Modify: `README.md`, `CHANGELOG.md`

**Key Decisions / Notes:**

- README: add a "Course landings (archetype rendering)" section — the read layer (`lib/cms/core` + `lib/cms/course-landing`), the renderer registry (`components/sections`), the `/courses/[code]` route, and the fixture-now / live-delivery-at-P4 note. Cross-link the genericization PRD + the cms-client scope doc.
- CHANGELOG: a `0.3.0` entry — "archetype+variant renderer registry + reference course page + cms-client-shaped read layer (course-landing); fixture-driven pending P4 live delivery."
- `Trivial:` does NOT apply per se, but this is docs-only → no RED test (docs are exempt from TDD); verified by inspection + the links resolving.

**Definition of Done:**

- [ ] README documents the read layer + registry + `/courses/[code]` + the fixture/P4 note; CHANGELOG has the `0.3.0` entry.
- [ ] Verify: `grep -q "courses/\[code\]\|renderer registry\|archetype" README.md && grep -q "0.3.0" CHANGELOG.md`

## E2E Results

Run against a fresh local `pnpm dev` (port 3100, no auth) via playwright-cli headless, on the post-code-review-fix tree. Tests 16/16, `tsc --noEmit` 0 errors, `next build` 0 errors (6/6 pages, `/courses/[code]` dynamic).

| Scenario | Priority | Result | Fix Attempts | Notes |
|----------|----------|--------|--------------|-------|
| TS-001 | Critical | PASS | 0 | Hero (Meridian Institute eyebrow + "Value Investing 101" h1 + "Enroll now"/"Download syllabus" CTAs), Collection ("What you'll learn" + 3 items), People ("Your instructors" + Asha Rao/Daniel Okafor), StatBand ("Outcomes" + Alumni/Avg rating/Completion) + inline.quote ("- Warren Buffett") all render from the fixture through the registry; navy/gold/serif theme applied (semantic tokens, no hardcoded hex) |
| TS-002 | High | PASS | 0 | The unregistered `{archetype:'custom-block',variant:'demo'}` section renders the UnknownSection placeholder ("Unsupported section: custom-block/demo"); page renders fully (no 500) |
| TS-003 | High | PASS | 0 | `/blog` renders (heading + post list); only console error is a benign `favicon.ico` 404 (pre-existing starter artifact, unrelated to the read-core refactor) |
| Nav interaction | - | PASS | 0 | Clicked the new "Courses" nav link from `/blog` -> navigated to `/courses/value-investing-101` with the course page rendered (snapshot -> click -> re-snapshot -> new state confirmed) |

Design Notes: `impeccable detect` clean (`[]`) on the rendered 74KB DOM. One numbered-section-markers Absolute-Ban (01/02/03 on Collection cards) was found mid-implementation and fixed (replaced with a gold hairline rule) before this run -- non-blocking, advisory.

## Verification Notes (code review)

xhigh `/code-review` (10 finder angles + verify + sweep) surfaced 10 candidates; 4 fixed, 6 mention-only:

**Fixed (in-lineage):**
- C1 `Inline.tsx` image variant: guarded `s.image?.url` (a malformed live `inline.image` would otherwise crash the whole route -- upholds the registry's never-crash Risk mitigation on the P4 go-live path).
- C2 `DynList.tsx`: guarded `s.source?.query` (same class as C1).
- Q3 `cms-fetch.ts`: corrected comment rot ("lowercase realm header" -> "realm header"; realm is sent verbatim, the behavior preserved from the old `source.ts`).
- Q4 `cms-fetch.ts`: removed the unused `revalidate` option (YAGNI -- no caller passes it).

**Mention-only (not fixed):**
- C3 `Inline.tsx` `default`->null can mask a future registered-but-unhandled `inline.<variant>` (drift); tied to Q1.
- Q1/Q2 `resolve.ts` `REGISTERED_KEYS` duplicates `SECTION_REGISTRY` keys + a single-use sentinel; a clean dedup is scope-expanding because `resolve.ts` must stay React-free (node-unit-tested). The 12 keys are adjacent in one folder; low drift risk. Revisit when P4 adds archetypes.
- Q5 `tags.ts` re-derives the `${realm}:${type}:list`/`:slug` format that `@zwingd-ce/cms-revalidate-nextjs` produces write-side; the package is not a 1:1 read-side drop-in. The doc comment already pins the contract; unify when `@zwingd-ce/cms-client` is built.
- R1/R2 `envelope.ts` media edge cases (deep-clobber of an opaque `inline.custom` payload bearing a `url` key; single-relation-only v4 media). Both are dormant: fixtures bypass the adapter, P4 is not wired, and the plan's Assumptions defers the exact P4 wire shape to "the envelope adapter absorbs it in one file."
