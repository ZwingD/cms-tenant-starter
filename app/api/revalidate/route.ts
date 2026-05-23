// app/api/revalidate/route.ts
/**
 * /api/revalidate — cms-backend webhook receiver.
 *
 * 3 lines of actual logic. Everything (HMAC verify, dual-tag emission,
 * path revalidation defense-in-depth, payloadVersion compat) lives in
 * @zwingd-ce/cms-revalidate-nextjs.
 *
 * Customize by passing `tagsFor` / `pathsFor` overrides if your
 * storefront has non-default routes (e.g. /articles instead of /blog).
 * See the package README for the full options shape.
 */
import { createRevalidateHandler } from "@zwingd-ce/cms-revalidate-nextjs";
import { CMS_TENANT_REALM, CMS_WEBHOOK_SECRET } from "@/lib/cms/env";

export const POST = createRevalidateHandler({
  secret: CMS_WEBHOOK_SECRET,
  realm: CMS_TENANT_REALM,
});
