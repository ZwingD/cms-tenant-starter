// lib/cms/core/envelope.ts
/**
 * The Strapi-v4 <-> native envelope adapter: the ONE place that knows the wire
 * shape. It unwraps the `sections` array from whatever delivery envelope (native
 * `{sections}` / bare array / v4 `{data:{attributes:{sections}}}`) and deep-
 * resolves every MediaRef to a flat `{url, alt}`. TOLERANT by contract: it does
 * a structural map, NOT a Zod parse, so an unrecognized archetype passes through
 * as `{archetype, variant}` (an UnknownArchetype) and nothing ever throws.
 *
 * This is the seam the genericization P7 native-envelope cutover flips, once,
 * for every tenant.
 *
 * Introduced: genericization P3.
 */
import type { MediaView, Section } from "../course-landing/types";

type Json = unknown;
const isObj = (v: Json): v is Record<string, Json> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** A v4 media wrapper: `{ data: { attributes: { url, alternativeText } } }`. */
function asV4Media(v: Record<string, Json>): MediaView | null {
  const data = v.data;
  if (!isObj(data)) return null;
  const attrs = data.attributes;
  if (!isObj(attrs) || typeof attrs.url !== "string") return null;
  const alt = attrs.alternativeText;
  return { url: attrs.url, alt: typeof alt === "string" ? alt : "" };
}

/** A native MediaRef carries a string `url` (CTAs use `href`, never `url`). */
function asNativeMedia(v: Record<string, Json>): MediaView | null {
  if (typeof v.url !== "string") return null;
  const alt = v.altText ?? v.alt ?? v.alternativeText;
  return { url: v.url, alt: typeof alt === "string" ? alt : "" };
}

/** Recursively convert any media-shaped node to `{url, alt}`; recurse otherwise. */
function resolveMediaDeep(value: Json): Json {
  if (Array.isArray(value)) return value.map(resolveMediaDeep);
  if (!isObj(value)) return value;
  const media = asV4Media(value) ?? asNativeMedia(value);
  if (media) return media;
  const out: Record<string, Json> = {};
  for (const [k, v] of Object.entries(value)) out[k] = resolveMediaDeep(v);
  return out;
}

/** Pull the sections array out of any supported delivery envelope. */
function extractSections(raw: Json): Json[] {
  if (Array.isArray(raw)) return raw;
  if (isObj(raw)) {
    if (Array.isArray(raw.sections)) return raw.sections;
    if (isObj(raw.data)) {
      const attrs = raw.data.attributes;
      if (isObj(attrs) && Array.isArray(attrs.sections)) return attrs.sections;
    }
    if (Array.isArray(raw.data)) return raw.data;
  }
  return [];
}

/**
 * Normalize a delivery response into renderable native sections. Never throws;
 * returns `[]` for an unparseable shape.
 */
export function toNativeSections(raw: Json): Section[] {
  return extractSections(raw).map((s) => resolveMediaDeep(s) as Section);
}
