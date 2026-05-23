# Zwingd CMS — Tenant Site Starter

Next.js 15 starter that's pre-wired to consume Zwingd CMS content and revalidate on edits. Designed to take a tenant from zero to live storefront in ~15 minutes with a Vercel account and no manual code copying.

## ▶ Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FZwingD%2Fcms-tenant-starter&env=CMS_BASE,CMS_TENANT_REALM,CMS_WEBHOOK_SECRET,CMS_BLOG_SOURCE&envDescription=Connect%20to%20your%20Zwingd%20CMS%20tenant.%20See%20README%20for%20each%20variable.&envLink=https%3A%2F%2Fgithub.com%2FZwingD%2Fcms-tenant-starter%23environment-variables&project-name=tenant-site)

Click the button → sign in to Vercel → it'll clone this repo into your GitHub org, prompt you for the four env vars (see below), build, and deploy.

After deploy, you'll have a live storefront serving **static placeholder content**. To wire up live CMS content, follow the **Connect to CMS** section.

## Quick start (after deploy)

### 1. Set the four env vars in Vercel

If you missed any during deploy, set them in **Project Settings → Environment Variables**. All four are server-side (no `NEXT_PUBLIC_` prefix).

| Variable | Value | Where to get it |
|---|---|---|
| `CMS_BASE` | `https://cms-api-dev.zwingd.com` (dev) or `https://cms-api.zwingd.com` (prod) | Zwingd documentation |
| `CMS_TENANT_REALM` | Your tenant slug (e.g. `techademy`) | Zwingd assigned this when your tenant was provisioned |
| `CMS_WEBHOOK_SECRET` | 32-byte hex string | Generated in the Zwingd CMS admin — see next section |
| `CMS_BLOG_SOURCE` | `STATIC` (default) or `CMS` | Leave as `STATIC` until step 3 below succeeds |

### 2. Register the webhook in Zwingd CMS admin

1. Open Zwingd CMS admin → **Settings → Webhooks** tab → **Add Webhook**
2. **URL**: `https://<your-vercel-domain>/api/revalidate`
3. **Secret**: click **Generate** — a fresh 32-byte hex secret fills in and is copied to your clipboard
4. **Paste that secret** into your Vercel project's `CMS_WEBHOOK_SECRET` env var (Project Settings → Environment Variables → edit) — **BEFORE** clicking Create. cms-backend hashes the secret on save; the response DTO omits the plaintext, so it cannot be retrieved from the admin API afterward.
5. **Events**: tick `content.published`, `content.unpublished`, `content.deleted`
6. Click **Create Webhook**

### 3. Flip to live CMS content

1. In Vercel, change `CMS_BLOG_SOURCE` from `STATIC` to `CMS`
2. Redeploy your project (or trigger a deploy from your Git provider)
3. Edit a published post in the Zwingd CMS admin
4. Within ~30 seconds, the edit should appear on your `/blog` index and detail pages

If propagation doesn't happen within ~30s, see [troubleshooting](#troubleshooting).

## What's in the repo

```
app/
├── layout.tsx              # Header + footer shell — replace with your design
├── page.tsx                # Home page — replace with your hero
├── globals.css             # Tailwind directives
├── blog/
│   ├── page.tsx            # Blog index — revalidate=30, list-tag wired
│   ├── [slug]/page.tsx     # Blog detail — revalidate=30, detail-tag wired
│   └── _static/articles.ts # Fallback sample posts for STATIC mode
└── api/revalidate/route.ts # 3-line webhook handler via the package
lib/cms/
├── env.ts                  # Typed reads of the 4 env vars
├── source.ts               # Reader: switches CMS vs STATIC, attaches Next tags
└── types.ts                # BlogPost shape
```

You'll customize `layout.tsx`, `page.tsx`, and the blog templates. You probably won't need to touch the package handler — it's stable.

## How revalidation works under the hood

This starter ships with [`@zwingd-ce/cms-revalidate-nextjs`](https://github.com/ZwingD/cms-revalidate-nextjs) as a dependency. When the CMS fires a webhook to `/api/revalidate`:

1. The handler verifies the HMAC signature (rejects with 401 on mismatch)
2. Validates the 5-minute replay window (rejects with 409 on stale)
3. Computes the affected tags (detail + list) and paths
4. Calls `revalidateTag` for each tag — invalidates cached fetches that opt in
5. Calls `revalidatePath` for each user-facing path — invalidates the page HTML directly (defense-in-depth, robust even when cached HTML predates tag instrumentation)
6. Returns 200

The blog index and detail pages both have `export const revalidate = 30` as a worst-case ISR backstop, so even if a webhook drops or fires against stale cache, the longest any user sees stale content is ~30 seconds.

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
| `/blog` shows the welcome placeholder forever | `CMS_BLOG_SOURCE=STATIC` (or unset) | Flip to `CMS` in Vercel env vars + redeploy. |
| Detail page updates after edit, list does not | Cached list HTML predates tag instrumentation | Trigger one manual Vercel redeploy to prime the cache. After that, the `revalidatePath` default catches future edits. |
| First deploy succeeds but `/api/revalidate` always 500s | `CMS_WEBHOOK_SECRET` is empty | Set it in Vercel env vars and redeploy. |

## License

UNLICENSED (your tenant code; treat it as proprietary).

## Source

[github.com/ZwingD/cms-tenant-starter](https://github.com/ZwingD/cms-tenant-starter)
