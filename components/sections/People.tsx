// components/sections/People.tsx
/** People archetype renderer: header + a roster of Person cards. */
import type { Archetype, PeopleView } from "@/lib/cms/course-landing/types";

export default function People({ section }: { section: Archetype }) {
  const s = section as PeopleView;
  return (
    <section className="bg-muted/40 px-6 py-14">
      <div className="mx-auto max-w-4xl">
        {s.header?.heading && (
          <h2 className="font-display text-3xl font-semibold text-ink">
            {s.header.heading}
          </h2>
        )}
        <ul className="mt-8 flex flex-wrap gap-8">
          {(s.people ?? []).map((p, i) => (
            <li key={i} className="max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image?.url && (
                <img
                  src={p.image.url}
                  alt={p.image.alt}
                  className="mb-3 h-16 w-16 rounded-full object-cover"
                />
              )}
              <p className="font-display text-lg font-medium text-ink">{p.name}</p>
              {p.designation && (
                <p className="text-sm text-accent">{p.designation}</p>
              )}
              {p.about && (
                <p className="mt-1 text-sm text-muted-foreground">{p.about}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
