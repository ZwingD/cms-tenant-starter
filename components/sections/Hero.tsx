// components/sections/Hero.tsx
/** Hero archetype renderer: header + ctas + a stats/ratings/badges strip. */
import type { Archetype, HeroView } from "@/lib/cms/course-landing/types";

export default function Hero({ section }: { section: Archetype }) {
  const s = section as HeroView;
  const chips = [
    ...(s.stats ?? []).map((x) => `${x.value}${x.label ? ` ${x.label}` : ""}`),
    ...(s.ratings ?? []).map(
      (r) => `${r.rating ?? ""}${r.platform ? ` on ${r.platform}` : ""}`.trim(),
    ),
    ...(s.badges ?? []).map((b) => b.label ?? "").filter(Boolean),
  ];
  return (
    <section className="border-b border-border bg-primary px-6 py-16 text-primary-foreground">
      <div className="mx-auto max-w-4xl space-y-5">
        {s.header?.eyebrow && (
          <p className="font-display text-sm uppercase tracking-[0.2em] text-accent">
            {s.header.eyebrow}
          </p>
        )}
        {s.header?.heading && (
          <h1 className="font-display text-5xl font-semibold leading-tight">
            {s.header.heading}
          </h1>
        )}
        {s.header?.subheading && (
          <p className="max-w-2xl text-lg text-primary-foreground/80">
            {s.header.subheading}
          </p>
        )}
        {!!s.ctas?.length && (
          <div className="flex flex-wrap gap-3 pt-2">
            {s.ctas.map((c, i) => (
              <a
                key={i}
                href={c.href ?? "#"}
                className={
                  i === 0
                    ? "rounded-md bg-accent px-5 py-2.5 font-medium text-primary"
                    : "rounded-md border border-accent/60 px-5 py-2.5 font-medium text-accent"
                }
              >
                {c.label ?? "Learn more"}
              </a>
            ))}
          </div>
        )}
        {!!chips.length && (
          <ul className="flex flex-wrap gap-x-6 gap-y-1 pt-4 text-sm text-primary-foreground/70">
            {chips.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
