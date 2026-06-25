// components/sections/UnknownSection.tsx
/**
 * Placeholder for a section whose archetype/variant the storefront doesn't know
 * (a future P4/P7 archetype). Renders a muted, dev-visible note and NEVER throws,
 * so one unrecognized section can't blank or crash the whole page.
 *
 * Introduced: genericization P3.
 */
import type { Section } from "@/lib/cms/course-landing/types";

export default function UnknownSection({ section }: { section: Section }) {
  const variant = "variant" in section ? section.variant : undefined;
  return (
    <div
      role="note"
      className="rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 p-4 text-sm text-muted-foreground"
    >
      Unsupported section: <code>{section.archetype}{variant ? `/${variant}` : ""}</code>
    </div>
  );
}
