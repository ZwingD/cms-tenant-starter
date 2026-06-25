// components/sections/StatBand.tsx
/** StatBand archetype renderer: optional header + a row of value/label stats. */
import type { Archetype, StatBandView } from "@/lib/cms/course-landing/types";

export default function StatBand({ section }: { section: Archetype }) {
  const s = section as StatBandView;
  return (
    <section className="bg-primary px-6 py-12 text-primary-foreground">
      <div className="mx-auto max-w-4xl">
        {s.header?.heading && (
          <h2 className="mb-6 font-display text-2xl font-semibold">
            {s.header.heading}
          </h2>
        )}
        <dl className="flex flex-wrap gap-x-16 gap-y-6">
          {(s.stats ?? []).map((st, i) => (
            <div key={i}>
              <dt className="font-display text-4xl font-semibold text-accent">
                {st.value}
              </dt>
              {st.label && (
                <dd className="mt-1 text-sm text-primary-foreground/70">
                  {st.label}
                </dd>
              )}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
