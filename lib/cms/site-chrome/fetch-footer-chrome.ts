// lib/cms/site-chrome/fetch-footer-chrome.ts
/**
 * Read the footer chrome (social links, legal links, copyright) for the active
 * realm. Mirrors lib/cms/navigation/fetch-navigation.ts: cmsFetch owns the realm
 * header, cache tags, 2s timeout and null-on-error, so this never throws -- the
 * footer degrades to empty on any CMS miss.
 *
 * Introduced: CMS-driven footer.
 * Plan: cms-backend/docs/plans/2026-08-12-platform-footer-tenant-onboarding.md Task 2
 */
import { CMS_TENANT_REALM } from "../env";
import { cmsFetch } from "../core/cms-fetch";
import { layoutTag, singletonTag } from "../core/tags";
import { normalizeFooterChrome } from "./normalize-footer-chrome";
import type { FooterChrome, FooterChromeEnvelope } from "./types";

const realm = CMS_TENANT_REALM;

/**
 * Returns normalized chrome, or `null` when the CMS is unreachable / has no
 * settings row. `null` and "all slots empty" are deliberately NOT collapsed:
 * the Footer component renders nothing for either, but keeping them distinct
 * leaves room for a caller to tell "CMS down" from "nothing authored".
 */
export async function fetchFooterChrome(): Promise<FooterChrome | null> {
  const raw = await cmsFetch<FooterChromeEnvelope>("/api/v1/site-chrome/footer", {
    realm,
    // `site-settings` is a SINGLETON on the write side, so SiteSettingsService
    // .upsert -> content.published -> computeTags busts `${realm}:site-settings`
    // and `${realm}:layout`. Never a `:list` tag -- see lib/cms/core/tags.ts.
    tags: [singletonTag(realm, "site-settings"), layoutTag(realm)],
  });
  return raw === null ? null : normalizeFooterChrome(raw);
}
