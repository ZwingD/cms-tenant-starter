// lib/cms/course-landing/types.ts
/**
 * Course-landing view models - the storefront-side mirror of the CMS generic
 * archetype contract (cms-backend/src/course-landing/dto/archetypes.ts), with
 * every MediaRef resolved to a flat { url, alt } and an open `meta` passthrough.
 *
 * This is the drift gate: a committed fixture (or a P4-delivered payload) must
 * type-check against `CourseLandingView`, so a missing/renamed field is a tsc
 * error rather than a silent blank section. `meta` is the adapter-internal
 * provenance bag (adminHidden in the served schema) - carried as an optional
 * passthrough the renderers ignore, never dropped by the tolerant adapter.
 *
 * Introduced: genericization P3 (storefront renderer registry).
 */

/** A MediaRef resolved by the envelope adapter to a flat URL + alt. */
export interface MediaView {
  url: string;
  alt: string;
}

/** Open provenance bag (adminHidden on the BE; renderers ignore it). */
export type Meta = Record<string, unknown> | null;

export interface CtaView {
  label?: string | null;
  href?: string | null;
  action?: string | null;
  variant?: string | null;
  icon?: MediaView | null;
  file?: MediaView | null;
  openInNewTab?: boolean | null;
}

export interface RatingView {
  platform?: string | null;
  icon?: MediaView | null;
  icons?: MediaView[] | null;
  rating?: number | null;
  reviewCount?: number | null;
}

/** Header is `HeaderPartial.nullish()` on every archetype -> all fields optional. */
export interface HeaderView {
  eyebrow?: string | null;
  heading?: string | null;
  subheading?: string | null;
}

export interface StatView {
  value: string;
  label?: string | null;
  icon?: MediaView | null;
}

export interface PersonView {
  name: string;
  designation?: string | null;
  image?: MediaView | null;
  about?: string | null;
  socials?: CtaView[] | null;
  meta?: Meta;
}

export interface CollectionItemView {
  title?: string | null;
  body?: string | null;
  icon?: MediaView | null;
  image?: MediaView | null;
  meta?: Meta;
}

export interface BadgeView {
  label?: string | null;
  image?: MediaView | null;
}

// --- The six object/inline archetypes ----------------------------------------

export interface HeroView {
  archetype: "hero";
  variant: string;
  header?: HeaderView | null;
  media?: MediaView[] | null;
  ctas?: CtaView[] | null;
  ratings?: RatingView[] | null;
  stats?: StatView[] | null;
  badges?: BadgeView[] | null;
  meta?: Meta;
}

export interface CollectionView {
  archetype: "collection";
  variant: string;
  header?: HeaderView | null;
  items?: CollectionItemView[] | null;
  cta?: CtaView | null;
  meta?: Meta;
}

export interface PeopleView {
  archetype: "people";
  variant: string;
  header?: HeaderView | null;
  people?: PersonView[] | null;
  meta?: Meta;
}

export interface StatBandView {
  archetype: "statband";
  variant: string;
  header?: HeaderView | null;
  stats?: StatView[] | null;
  meta?: Meta;
}

/** DynList is catalog-backed: it stores only framing + a `source` query; the
 *  items are resolved server-side (never authored, no `items` field). */
export interface DynListView {
  archetype: "dynlist";
  variant: string;
  header?: HeaderView | null;
  source: { query: string; limit?: number | null };
  meta?: Meta;
}

// Inline - discriminated on `variant`, each member's own required fields.
export type InlineView =
  | { archetype: "inline"; variant: "quote"; body: string; author?: string | null }
  | { archetype: "inline"; variant: "image"; image: MediaView; caption?: string | null }
  | { archetype: "inline"; variant: "divider"; style?: string | null }
  | { archetype: "inline"; variant: "spacer"; heightPx: number }
  | {
      archetype: "inline";
      variant: "cta";
      header?: HeaderView | null;
      cta?: CtaView | null;
      image?: MediaView | null;
      meta?: Meta;
    }
  | {
      archetype: "inline";
      variant: "card";
      header?: HeaderView | null;
      icon?: MediaView | null;
      meta?: Meta;
    }
  | {
      archetype: "inline";
      variant: "custom";
      key: string;
      payload: Record<string, unknown>;
    };

/** The known archetype union (the storefront's renderable shapes). */
export type Archetype =
  | HeroView
  | CollectionView
  | PeopleView
  | StatBandView
  | DynListView
  | InlineView;

/**
 * Forward-compat catch-all: a delivered section whose archetype the storefront
 * doesn't know (a future P4/P7 addition). The registry renders these via
 * UnknownSection; the tolerant envelope adapter never drops or throws on them.
 */
export interface UnknownArchetype {
  archetype: string;
  variant?: string;
}

/** A section as it reaches the renderer registry. */
export type Section = Archetype | UnknownArchetype;

/** A course-landing page: a code + an ordered list of sections. */
export interface CourseLandingView {
  code: string;
  sections: Section[];
}
