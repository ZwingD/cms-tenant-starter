// lib/cms/navigation/fetch-navigation.ts
/**
 * Read the resolved navigation for a location (default "header") for the active
 * realm. Mirrors lib/cms/course-landing/fetch-course-landing.ts: cmsFetch owns the
 * realm header, cache tags, 2s timeout, and null-on-error, so this never throws -
 * the header renders empty on any CMS miss.
 *
 * Introduced: navigation mega-menu north-star demo.
 */
import { CMS_TENANT_REALM } from "../env";
import { cmsFetch } from "../core/cms-fetch";
import { layoutTag, singletonTag } from "../core/tags";
import type { NavResponse } from "./types";

const realm = CMS_TENANT_REALM;

export async function fetchNavigation(
  location = "header",
): Promise<NavResponse | null> {
  return cmsFetch<NavResponse>(`/api/v1/navigation/${location}`, {
    realm,
    // `navigation` is a SINGLETON on the write side, so the webhook busts
    // `${realm}:navigation` + `${realm}:layout` and never a `:list` tag. This
    // read previously used `listTag(realm, "navigation")`, which matched
    // neither -- the nav was cached and then never invalidated by a CMS edit.
    // Subscribe to both so either emission refreshes it.
    tags: [singletonTag(realm, "navigation"), layoutTag(realm)],
  });
}
