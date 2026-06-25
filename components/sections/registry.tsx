// components/sections/registry.tsx
/**
 * The archetype+variant renderer registry + <SectionList>. Maps each registry
 * key (object archetype, or `inline.<variant>`) to its component; the resolver
 * (resolve.ts) keeps it crash-proof - an unregistered section renders
 * UnknownSection, never throws. The `section as Archetype` narrowing is safe by
 * construction (the key only resolves for a known archetype); no `as unknown`.
 *
 * Introduced: genericization P3.
 */
import type { FC } from "react";
import type { Archetype, Section } from "@/lib/cms/course-landing/types";
import Hero from "./Hero";
import Collection from "./Collection";
import People from "./People";
import StatBand from "./StatBand";
import DynList from "./DynList";
import Inline from "./Inline";
import UnknownSection from "./UnknownSection";
import { resolveRendererKey, UNKNOWN_KEY } from "./resolve";

export const SECTION_REGISTRY: Record<string, FC<{ section: Archetype }>> = {
  hero: Hero,
  collection: Collection,
  people: People,
  statband: StatBand,
  dynlist: DynList,
  "inline.quote": Inline,
  "inline.image": Inline,
  "inline.divider": Inline,
  "inline.spacer": Inline,
  "inline.cta": Inline,
  "inline.card": Inline,
  "inline.custom": Inline,
};

export function SectionList({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, i) => {
        const key = resolveRendererKey(section);
        if (key === UNKNOWN_KEY) {
          return <UnknownSection key={i} section={section} />;
        }
        const Renderer = SECTION_REGISTRY[key];
        return <Renderer key={i} section={section as Archetype} />;
      })}
    </>
  );
}
