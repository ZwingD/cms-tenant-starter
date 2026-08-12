# Zwingd CMS — Tenant Site Starter

Next.js 15 starter that's pre-wired to consume Zwingd CMS content and revalidate on edits. Designed to take a tenant from zero to live storefront in ~15 minutes with a Vercel account and no manual code copying.

## ▶ Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZwingD%2Fcms-tenant-starter&env=CMS_BASE,CMS_TENANT_REALM,CMS_WEBHOOK_SECRET&envDescription=Connect%20to%20your%20Zwingd%20CMS%20tenant.%20See%20README%20for%20each%20variable.&envLink=https%3A%2F%2Fgithub.com%2FZwingD%2Fcms-tenant-starter%23environment-variables&project-name=tenant-site)

Click the button → sign in to Vercel → it'll clone this repo into your GitHub org, prompt you for the three env vars (see below), build, and deploy.

After deploy, you'll have a live storefront connected to your Zwingd CMS tenant. If the tenant has no posts yet, the `/blog` index renders a friendly empty state with a link to the CMS admin — publish your first post and it appears live (within ~30s via the webhook below).

## Quick start (after deploy)

### 1. Set the three env vars in Vercel

If you missed any during deploy, set them in **Project Settings → Environment Variables**. All three are server-side (no `NEXT_PUBLIC_` prefix).

| Variable | Value | Where to get it |
|---|---|---|
| `CMS_BASE` | `https://cms-api-dev.zwingd.com` (dev) or `https://cms-api.zwingd.com` (prod) | Zwingd documentation |
| `CMS_TENANT_REALM` | Your tenant slug (e.g. `techademy`) | Zwingd assigned this when your tenant was provisioned |
| `CMS_WEBHOOK_SECRET` | 32-byte hex string | Generated in the Zwingd CMS admin — see next section |

### 2. Register the webhook in Zwingd CMS admin

1. Open Zwingd CMS admin → **Settings → Webhooks** tab → **Add Webhook**
2. **URL**: `https://<your-vercel-domain>/api/revalidate`
3. **Secret**: click **Generate** — a fresh 32-byte hex secret fills in and is copied to your clipboard
4. **Paste that secret** into your Vercel project's `CMS_WEBHOOK_SECRET` env var (Project Settings → Environment Variables → edit) — **BEFORE** clicking Create. cms-backend hashes the secret on save; the response DTO omits the plaintext, so it cannot be retrieved from the admin API afterward.
5. **Events**: tick `content.published`, `content.unpublished`, `content.deleted`
6. Click **Create Webhook**

Edits in the Zwingd CMS admin propagate to your storefront within ~30 seconds. If propagation doesn't happen, see [troubleshooting](#troubleshooting).

## What's in the repo

```
app/
├── layout.tsx              # Chrome shell — server-fetches header nav, footer nav
│                           #   and footer chrome in parallel, renders <Footer>.
│                           #   Restyle it; don't replace the CMS wiring.
├── page.tsx                # Home page — replace with your hero
├── globals.css             # Tailwind directives + base theme tokens
├── blog/
│   ├── page.tsx            # Blog index — revalidate=30, list-tag wired
│   ├── [slug]/page.tsx     # Blog detail — revalidate=30, detail-tag wired
│   └── _static/_demo-articles.ts # Local-dev demo fixtures — NOT imported at runtime
├── courses/[code]/page.tsx # Course landing — renders generic archetype sections
└── api/revalidate/route.ts # 3-line webhook handler via the package
components/layout/
└── Footer.tsx              # CMS-driven footer — props in, JSX out, no fetching
components/sections/        # Renderer registry: archetype/variant → React component
├── registry.tsx            # SECTION_REGISTRY + <SectionList> (crash-proof)
├── resolve.ts              # resolveRendererKey(section) → registry key | unknown
├── UnknownSection.tsx      # Fallback for unregistered archetypes/variants
└── Hero|Collection|People|StatBand|DynList|Inline.tsx # Themed section renderers
lib/cms/
├── env.ts                  # Typed reads of the 3 env vars
├── source.ts               # Blog reader (now built on core/), returns [] on error/empty
├── types.ts                # BlogPost shape
├── core/                   # cms-client-shaped read layer (extraction target)
│   ├── cms-fetch.ts        # cmsFetch<T>: realm header, tags, timeout, null-on-error
│   ├── envelope.ts         # toNativeSections: Strapi-v4 ↔ native adapter (tolerant)
│   └── tags.ts             # listTag / detailTag — shared cache-tag contract
└── course-landing/         # Course-landing read path
    ├── types.ts            # Archetype view models (Hero/Collection/People/…)
    ├── fetch-course-landing.ts # Live archetype delivery, static-fixture fallback
    └── _fixtures/reference-course.ts # Reference "Meridian Institute" course
```

You'll customize `layout.tsx`, `page.tsx`, the blog templates, and the `components/sections/*` renderers (re-theme via `tailwind.config.ts` tokens — no component changes needed). You probably won't need to touch the package handler — it's stable.

## How revalidation works under the hood

This starter ships with [`@zwingd-ce/cms-revalidate-nextjs`](https://github.com/ZwingD/cms-revalidate-nextjs) as a dependency. When the CMS fires a webhook to `/api/revalidate`:

1. The handler verifies the HMAC signature (rejects with 401 on mismatch)
2. Validates the 5-minute replay window (rejects with 409 on stale)
3. Computes the affected tags (detail + list) and paths
4. Calls `revalidateTag` for each tag — invalidates cached fetches that opt in
5. Calls `revalidatePath` for each user-facing path — invalidates the page HTML directly (defense-in-depth, robust even when cached HTML predates tag instrumentation)
6. Returns 200

The blog index and detail pages both have `export const revalidate = 30` as a worst-case ISR backstop, so even if a webhook drops or fires against stale cache, the longest any user sees stale content is ~30 seconds.

## Course landings (archetype rendering)

Beyond blog, this starter renders **course-landing pages from Zwingd's generic
section model** — a page is a list of `archetype` sections (`hero`,
`collection`, `people`, `statband`, `dynlist`) plus `inline.<variant>` blocks,
each carrying a typed payload. `/courses/[code]` fetches a landing by code and
renders its sections through a registry — no per-page templates.

How the pieces fit:

- **Read layer** (`lib/cms/core` + `lib/cms/course-landing`) — `cmsFetch` does
  the realm-scoped, tag-tagged, timeout-bounded fetch (returns `null`, never
  throws); `envelope.toNativeSections` tolerantly maps either a Strapi-v4
  envelope or a native one to archetype objects (unknown archetypes pass
  through untouched). This layer is shaped for later extraction into the shared
  `@zwingd-ce/cms-client` package — see
  [`.workspace/docs/cms-client-package-scope.md`](../.workspace/docs/cms-client-package-scope.md).
- **Renderer registry** (`components/sections`) — `<SectionList>` resolves each
  section by `archetype` (or `inline.<variant>`) to a themed component;
  anything unregistered renders `UnknownSection` instead of crashing the page.
- **Theme** (`tailwind.config.ts` + `app/globals.css`) — the reference site is
  a deliberately non-default identity (deep navy + gold accent + a serif
  display face). Re-skinning is a token edit; the section components never
  hardcode colors.

**Fixture now, live delivery at P4.** `fetchCourseLanding` already consumes a
live archetype-shaped delivery body when one is served, but the generic
delivery endpoint is not wired yet (tracked as P4 in the
[section-model genericization PRD](../cms-backend/docs/prd/2026-06-25-section-model-genericization.md)).
Until then the `/courses/[code]` route falls back to the committed reference
fixture (`lib/cms/course-landing/_fixtures/reference-course.ts`) — the same
code path goes live unchanged once P4 serves archetype payloads. Add a
`course-landing` tag/path mapping in `route.ts` (see below) when you wire it.

## The footer is CMS-driven

The footer renders entirely from CMS configuration — no code change and no
deploy to change a link. It reads two surfaces, both server-side:

| Surface | Endpoint | What it supplies |
|---|---|---|
| Footer link columns | `GET /api/v1/navigation/footer` | One column per nav item: `label` is the heading, `children[]` the links |
| Footer chrome | `GET /api/v1/site-chrome/footer` | `socialLinks[]`, `legalLinks[]`, `copyright` |

Author them in the Zwingd CMS admin under **Navigation → Footer** and
**Site Settings → Footer**, or run `node scripts/seed-northwind-demo.mjs` to
populate the `northwind` demo realm with a working example.

**Empty slots render nothing.** A tenant that uses only link columns gets only
link columns — no empty containers and no orphan separators. If the CMS is
unreachable, the footer is omitted entirely and the rest of the page is
unaffected. The one exception is `copyright`: an authored-but-blank value falls
back to `© <year>`, which is the platform convention `FooterConfigSchema`
assumes (it allows `""` precisely because consumers fall back).

**Deliberately not consumed:** `logo`, `offices[]` and `CopyRightInfo`. The
first two are deferred per the
[PRD](../cms-backend/docs/prd/2026-08-12-platform-footer-tenant-onboarding.md);
`CopyRightInfo` is raw HTML that needs a sanitization decision and ships with
the editorial-review-gating work. Note that `logo` must still be sent as
explicit `null` on a `PUT` — `FooterConfigSchema` declares it nullable but not
optional, so omitting the key is a 400.

**Cache tags:** both footer reads subscribe to singleton tags
(`${realm}:site-settings` / `${realm}:navigation`, plus `${realm}:layout`) —
never `:list`. `site-settings` and `navigation` are singletons on the write
side, so a `:list` tag would never be busted and the footer would go stale
permanently. Use `singletonTag()` / `layoutTag()` from `lib/cms/core/tags.ts`
for any one-per-realm surface; `listTag()` / `detailTag()` are for slug-bearing
content only.

## Adding more content types

The default tag/path mappings handle `blog-post` (with slug → detail + list) and singletons (`site-settings`, `navigation` → bare tag). For other types — pages, course-landings, etc. — override `tagsFor` / `pathsFor` in `app/api/revalidate/route.ts`. See the [package README](https://github.com/ZwingD/cms-revalidate-nextjs#api) for the signature.

## Local development

```bash
pnpm install                    # or npm / yarn — repo doesn't enforce a manager
cp .env.example .env.local      # fill in real values
pnpm dev                        # http://localhost:3000
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `/api/revalidate` returns 401 | HMAC secret mismatch | Compare `CMS_WEBHOOK_SECRET` in Vercel to what you set when registering the webhook. If unsure, rotate by clicking Generate again in the CMS admin + update Vercel env. |
| `/api/revalidate` returns 409 | Stale webhook timestamp | Clock skew on Vercel runners is normally < 1s. If consistent, increase `replayWindowMs` in `route.ts`. |
| `/api/revalidate` returns 426 | cms-backend emitting a newer payload schema than this package understands | Upgrade `@zwingd-ce/cms-revalidate-nextjs` to the latest version. |
| `/blog` shows the "No posts yet" empty state but you've published posts | Most likely `CMS_BASE` / `CMS_TENANT_REALM` mismatch (the reader treats fetch errors as empty) | Verify the env vars match your CMS admin's tenant + base URL. Hit `${CMS_BASE}/api/v1/blog` with header `realm: <CMS_TENANT_REALM>` from your shell to confirm a non-empty `items` array. |
| Detail page updates after edit, list does not | Cached list HTML predates tag instrumentation | Trigger one manual Vercel redeploy to prime the cache. After that, the `revalidatePath` default catches future edits. |
| First deploy succeeds but `/api/revalidate` always 500s | `CMS_WEBHOOK_SECRET` is empty | Set it in Vercel env vars and redeploy. |

## License

UNLICENSED (your tenant code; treat it as proprietary).

## Source

[github.com/ZwingD/cms-tenant-starter](https://github.com/ZwingD/cms-tenant-starter)
