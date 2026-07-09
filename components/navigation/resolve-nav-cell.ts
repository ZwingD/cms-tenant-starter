// components/navigation/resolve-nav-cell.ts
/**
 * Crash-proof nav-cell key resolver. Maps a (possibly unknown) mega-menu cell to
 * its renderer registry key: `dynlist` -> the CatalogList; `inline.<variant>` for
 * image/card -> the Promo cells; anything unregistered resolves to UNKNOWN_KEY so
 * the header renders UnknownCell (nothing) instead of crashing. Pure + tolerant of
 * missing fields, so it is unit-tested in node without rendering React. Mirrors the
 * P3 section resolver (components/sections/resolve.ts) + the Techademy nav dispatch
 * (hybrid-mega-menu.tsx resolveCellRenderer).
 *
 * Introduced: navigation mega-menu north-star demo.
 */
import type { NavCell } from "@/lib/cms/navigation/types";

/** The cell keys this reference storefront renders (CatalogList + image/card Promo). */
export const REGISTERED_KEYS: ReadonlySet<string> = new Set([
  "dynlist",
  "inline.image",
  "inline.card",
]);

/** Sentinel for any cell archetype/variant the registry does not know. */
export const UNKNOWN_KEY = "__unknown__";

/** Resolve a cell to its registry key (or UNKNOWN_KEY). Never throws. */
export function resolveNavCellKey(cell: NavCell): string {
  const archetype = cell?.archetype ?? "";
  const key =
    archetype === "inline" ? `inline.${cell?.variant ?? ""}` : archetype;
  return REGISTERED_KEYS.has(key) ? key : UNKNOWN_KEY;
}
