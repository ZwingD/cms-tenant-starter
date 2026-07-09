// lib/cms/navigation/types.ts
/**
 * Nav delivery types - the shape of GET /api/v1/navigation/:location (cms-backend
 * nav delivery). Each mega-menu cell's courses are already resolved server-side
 * into `cell.items`. Ported from the Techademy storefront's navigation.types.ts,
 * trimmed to the cells this reference storefront renders (dynlist + inline.image/
 * card/cta). Index signatures keep forward archetypes parseable without a type
 * change.
 *
 * Introduced: navigation mega-menu north-star demo.
 */

/** A course resolved into a CatalogList (`dynlist`) cell. Booleans may arrive as
 * string "true"/"false". */
export interface NavCatalogCourse {
  code?: string;
  name?: string;
  logoUrl?: string;
  globalAccreditationName?: string;
  isBestSeller?: boolean | string;
  isTrending?: boolean | string;
  isNew?: boolean | string;
  isPopular?: boolean | string;
  isRecommended?: boolean | string;
  durationInHrs?: number | string;
  [k: string]: unknown;
}

/** One archetype cell in a nav item's mega-menu grid. `archetype` (+ `variant` for
 * inline cells) drives the renderer registry; `items` holds the server-resolved
 * courses for a `dynlist` cell. */
export interface NavCell {
  archetype: string;
  variant?: string;
  header?: { heading?: string; eyebrow?: string };
  source?: { query?: string; limit?: number | null };
  items?: NavCatalogCourse[];
  /** `inline.image` banner: server-resolved media {url, alt}. */
  image?: { url: string; alt?: string };
  /** `inline.image` caption line below the banner. */
  caption?: string;
  /** `inline.cta` call-to-action link. */
  cta?: { href?: string; label?: string; openInNewTab?: boolean };
  /** `inline.card` server-resolved icon media {url, alt}. */
  icon?: { url: string; alt?: string };
  [k: string]: unknown;
}

/** The grid of archetype cells authored on a nav item. */
export interface NavMegaMenu {
  columns: number;
  rows: number;
  cells: NavCell[];
  [k: string]: unknown;
}

/** A curated link in the nav item's link column (the `children[]` LinkGroup). */
export interface NavChild {
  label: string;
  url: string;
}

/** A top-level navigation item; carries an optional mega-menu + curated children. */
export interface NavItem {
  label: string;
  url: string;
  children?: NavChild[];
  megaMenu?: NavMegaMenu;
}

/** The delivery envelope for a location (extra fields are tolerated + ignored). */
export interface NavResponse {
  location: string;
  items: NavItem[];
  [k: string]: unknown;
}
