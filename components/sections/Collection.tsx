// components/sections/Collection.tsx
/** Collection archetype renderer: header + a typed item list (intentional
 *  two-column editorial layout, not identical shadowed cards). */
import type { Archetype, CollectionView } from "@/lib/cms/course-landing/types";

export default function Collection({ section }: { section: Archetype }) {
  const s = section as CollectionView;
  return (
    <section className="px-6 py-14">
      <div className="mx-auto max-w-4xl">
        {s.header?.heading && (
          <h2 className="font-display text-3xl font-semibold text-ink">
            {s.header.heading}
          </h2>
        )}
        {s.header?.subheading && (
          <p className="mt-2 text-muted-foreground">{s.header.subheading}</p>
        )}
        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {(s.items ?? []).map((item, i) => (
            <article key={i} className="bg-paper p-6">
              {item.title && (
                <h3 className="font-display text-lg font-medium text-ink">
                  <span className="mb-3 block h-px w-8 bg-accent" aria-hidden />
                  {item.title}
                </h3>
              )}
              {item.body && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
