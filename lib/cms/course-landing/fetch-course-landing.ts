// lib/cms/course-landing/fetch-course-landing.ts
/**
 * Read a course landing by code, normalize it to archetype sections, and fall
 * back to a committed fixture when the CMS yields nothing renderable.
 *
 * P4: points at the native archetype delivery endpoint
 * (`/api/v1/archetype-landings/<realm>/<code>`), which serves `{code, sections}`
 * with each section `archetype:`-keyed and media resolved to `{url, alt}`. When
 * the CMS has published archetype content for the realm+code, that renders live;
 * otherwise the endpoint 404s (or yields a non-archetype body), `isArchetypeShaped`
 * fails, and the committed fixture takes over (offline / not-yet-authored).
 *
 * Realm comes from `CMS_TENANT_REALM` (env) - no hardcoded realm, so onboarding
 * the next tenant is an env change, not a code change.
 *
 * Introduced: genericization P3; live archetype delivery wired in P4.
 */
import { CMS_TENANT_REALM } from "../env";
import { cmsFetch } from "../core/cms-fetch";
import { detailTag } from "../core/tags";
import { toNativeSections } from "../core/envelope";
import type { CourseLandingView, Section } from "./types";

const realm = CMS_TENANT_REALM;

/** True only when every section is archetype-shaped (has a string `archetype`). */
function isArchetypeShaped(sections: Section[]): boolean {
  return (
    sections.length > 0 &&
    sections.every(
      (s) => typeof (s as { archetype?: unknown }).archetype === "string",
    )
  );
}

export async function fetchCourseLanding(
  code: string,
  { fallback }: { fallback: CourseLandingView },
): Promise<CourseLandingView> {
  const raw = await cmsFetch<unknown>(
    `/api/v1/archetype-landings/${realm}/${code}`,
    { realm, tags: [detailTag(realm, "course-landing", code)] },
  );
  const sections = toNativeSections(raw);
  return isArchetypeShaped(sections) ? { code, sections } : fallback;
}
