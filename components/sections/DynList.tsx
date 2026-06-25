// components/sections/DynList.tsx
/** DynList archetype renderer: header + a framing line for the `source` query.
 *  DynList is catalog-backed (items resolved server-side, no `items` field) -
 *  P3 shows the framing; P4 wires the live resolved list. */
import type { Archetype, DynListView } from "@/lib/cms/course-landing/types";

export default function DynList({ section }: { section: Archetype }) {
  const s = section as DynListView;
  return (
    <section className="px-6 py-12">
      <div className="mx-auto max-w-4xl rounded-lg border border-dashed border-border p-6">
        {s.header?.heading && (
          <h2 className="font-display text-2xl font-semibold text-ink">
            {s.header.heading}
          </h2>
        )}
        {s.source?.query && (
          <p className="mt-2 text-sm text-muted-foreground">
            Dynamic content: <code className="text-accent">{s.source.query}</code>
            {s.source.limit ? ` (up to ${s.source.limit})` : ""} - resolved at
            delivery time.
          </p>
        )}
      </div>
    </section>
  );
}
