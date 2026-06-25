// components/sections/Inline.tsx
/** Inline archetype renderer: narrows on the `variant` discriminator and renders
 *  the matching atomic block (quote/image/divider/spacer/cta/card/custom). */
import type { Archetype, InlineView } from "@/lib/cms/course-landing/types";

export default function Inline({ section }: { section: Archetype }) {
  const s = section as InlineView;
  switch (s.variant) {
    case "quote":
      return (
        <figure className="mx-auto max-w-3xl px-6 py-12">
          <blockquote className="border-l-2 border-accent pl-5 font-display text-2xl italic text-ink">
            {s.body}
          </blockquote>
          {s.author && (
            <figcaption className="mt-3 pl-5 text-sm text-muted-foreground">
              - {s.author}
            </figcaption>
          )}
        </figure>
      );
    case "image":
      // Guard the required nested `image`: the envelope adapter is tolerant (it
      // does not enforce shape), so a malformed live `inline.image` could arrive
      // without a resolved media node. Degrade to nothing rather than crash the
      // whole page (upholds the registry's never-crash contract on the P4 path).
      if (!s.image?.url) return null;
      return (
        <div className="mx-auto max-w-3xl px-6 py-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={s.image.url} alt={s.image.alt ?? ""} className="w-full rounded-lg" />
          {s.caption && (
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {s.caption}
            </p>
          )}
        </div>
      );
    case "divider":
      return <hr className="mx-auto my-8 max-w-3xl border-border" />;
    case "spacer":
      return <div style={{ height: `${s.heightPx}px` }} aria-hidden />;
    case "cta":
      return (
        <section className="mx-auto max-w-3xl px-6 py-10 text-center">
          {s.header?.heading && (
            <h2 className="font-display text-2xl font-semibold text-ink">
              {s.header.heading}
            </h2>
          )}
          {s.cta?.href && (
            <a
              href={s.cta.href}
              className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground"
            >
              {s.cta.label ?? "Learn more"}
            </a>
          )}
        </section>
      );
    case "card":
      return (
        <div className="mx-auto my-6 max-w-3xl rounded-lg border border-border p-6">
          {s.header?.heading && (
            <h3 className="font-display text-lg font-medium text-ink">
              {s.header.heading}
            </h3>
          )}
        </div>
      );
    case "custom":
      // ADMIN-only escape hatch: render nothing visible by default (the payload
      // is tenant-defined). Storefronts opt in per `key`.
      return null;
    default:
      return null;
  }
}
