// lib/cms/site-chrome/types.ts
/**
 * Site-chrome delivery types for the footer surface -- the shape of
 * GET /api/v1/site-chrome/footer (cms-backend `ConfigDeliveryService.getFooter`)
 * and the flat shape the storefront actually renders.
 *
 * Two distinct types on purpose. The wire type is the Strapi-v4-compatible
 * envelope cms-backend serves for byte-compatibility with the pre-cutover
 * storefronts; the render type is flat, total, and safe. `normalizeFooterChrome`
 * is the only bridge between them, so no component ever walks the envelope.
 *
 * Introduced: CMS-driven footer.
 * Plan: cms-backend/docs/plans/2026-08-12-platform-footer-tenant-onboarding.md Task 2
 */

/** A social-network link. `platform` drives labelling (no icon set here yet). */
export interface FooterSocialLink {
  platform: string;
  href: string;
}

/** A legal / utility link in the footer's legal row. */
export interface FooterLegalLink {
  label: string;
  href: string;
  openInNewTab: boolean;
}

/**
 * Footer chrome as the components consume it.
 *
 * TOTAL by construction: every slot is always present, and an unauthored slot
 * is an empty array or empty string -- never `undefined`. That is what lets the
 * Footer component decide "render this slot?" with a plain length check instead
 * of defensive optional chaining at every call site.
 */
export interface FooterChrome {
  socialLinks: FooterSocialLink[];
  legalLinks: FooterLegalLink[];
  copyright: string;
}

/**
 * The raw delivery envelope. Every level is optional/nullable because
 * `getFooter` returns `{ data: { footer: { data: null } } }` for a realm with
 * no settings row, and serves `attributes` (the stored JSONB) verbatim with no
 * re-validation -- so its inner shape is genuinely unknown at compile time.
 */
export interface FooterChromeEnvelope {
  data?: {
    footer?: {
      data?: { id?: string; attributes?: unknown } | null;
    } | null;
  } | null;
}
