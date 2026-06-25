// lib/cms/course-landing/fetch-course-landing.ts
/**
 * Read a course landing by code, normalize it to archetype sections, and fall
 * back to a committed fixture when the CMS yields nothing renderable.
 *
 * P3 reality: native archetype delivery isn't wired (P4/P7), so the live path
 * returns the LEGACY envelope whose sections carry `type:` (not `archetype:`) -
 * `isArchetypeShaped` rejects that and the fixture wins. Once P4 serves archetype
 * payloads, the same code path goes live with no change here.
 *
 * Introduced: genericization P3.
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
    `/api/v1/course-landings/by-code/${realm}/${code}`,
    { realm, tags: [detailTag(realm, "course-landing", code)] },
  );
  const sections = toNativeSections(raw);
  return isArchetypeShaped(sections) ? { code, sections } : fallback;
}
