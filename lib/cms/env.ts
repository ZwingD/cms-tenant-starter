// lib/cms/env.ts
/**
 * Typed CMS env. Server-only — none of these are NEXT_PUBLIC_, so they
 * stay out of the browser bundle.
 *
 * env.example documents the values + where to fetch each from.
 */
export const CMS_BASE = process.env.CMS_BASE ?? "";
export const CMS_TENANT_REALM = process.env.CMS_TENANT_REALM ?? "";
export const CMS_WEBHOOK_SECRET = process.env.CMS_WEBHOOK_SECRET ?? "";
