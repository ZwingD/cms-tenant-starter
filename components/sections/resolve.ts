// components/sections/resolve.ts
/**
 * The crash-proof section-key resolver. Maps a (possibly unknown) section to its
 * registry key: object archetypes key on `archetype`, inline variants on
 * `inline.<variant>`, and anything unregistered resolves to UNKNOWN_KEY so the
 * page renders an UnknownSection placeholder instead of crashing. Pure + tolerant
 * of `UnknownArchetype` (structural `{archetype, variant?}`), so it is unit-tested
 * in node without rendering React.
 *
 * Introduced: genericization P3.
 */
import type { Section } from "@/lib/cms/course-landing/types";

/** The 12 archetype keys the storefront renders (5 object + 7 inline.<variant>). */
export const REGISTERED_KEYS: ReadonlySet<string> = new Set([
  "hero",
  "collection",
  "people",
  "statband",
  "dynlist",
  "inline.quote",
  "inline.image",
  "inline.divider",
  "inline.spacer",
  "inline.cta",
  "inline.card",
  "inline.custom",
]);

/** Sentinel key for any archetype/variant the registry doesn't know. */
export const UNKNOWN_KEY = "__unknown__";

/** Resolve a section to its registry key (or UNKNOWN_KEY). Never throws. */
export function resolveRendererKey(section: Section): string {
  const variant = "variant" in section ? section.variant : undefined;
  const key =
    section.archetype === "inline" ? `inline.${variant ?? ""}` : section.archetype;
  return REGISTERED_KEYS.has(key) ? key : UNKNOWN_KEY;
}
