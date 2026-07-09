// components/navigation/cells.tsx
/**
 * The nav mega-menu cell renderers + the archetype registry. Ported from the
 * Techademy HybridMegaMenu cells (hybrid-mega-menu.tsx), restyled with Northwind
 * semantic Tailwind tokens (`nw-*`, defined in tailwind.config.ts). A `dynlist`
 * cell renders its server-resolved courses (CatalogList); `inline.image`/
 * `inline.card` render the Promo; every other/unknown cell renders UnknownCell
 * (nothing, never throws). The registry + <NavCells> dispatch mirror the P3 section
 * registry (components/sections/registry.tsx). Server components (no interactivity).
 *
 * Introduced: navigation mega-menu north-star demo.
 */
import type { FC } from "react";
import type { NavCatalogCourse, NavCell } from "@/lib/cms/navigation/types";
import { resolveNavCellKey } from "./resolve-nav-cell";

/** CatalogList (`dynlist`): the category's server-resolved courses. */
export const CatalogListCell: FC<{ cell: NavCell }> = ({ cell }) => {
  const courses = cell?.items ?? [];
  if (courses.length === 0) {
    return <p className="px-4 py-2 text-xs text-muted-foreground">No courses yet.</p>;
  }
  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      {courses.map((course: NavCatalogCourse, i: number) => (
        <a
          key={course?.code ?? i}
          href={course?.code ? `/courses/${course.code}` : "#"}
          className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
        >
          {course?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.logoUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded object-contain"
            />
          ) : null}
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-ink">
              {course?.name ?? ""}
            </span>
            {course?.globalAccreditationName ? (
              <span className="truncate text-xs text-muted-foreground">
                {course.globalAccreditationName}
              </span>
            ) : null}
          </span>
        </a>
      ))}
    </div>
  );
};

/** Promo `inline.image`: a merchandising banner image + optional caption. */
export const PromoImageCell: FC<{ cell: NavCell }> = ({ cell }) => {
  const url = cell?.image?.url;
  if (!url) return null;
  return (
    <div className="flex flex-col gap-1.5 px-4 py-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={cell?.image?.alt ?? ""}
        className="w-full rounded-lg object-cover"
      />
      {cell?.caption ? (
        <p className="text-xs text-muted-foreground">{cell.caption}</p>
      ) : null}
    </div>
  );
};

/** Promo `inline.card`: icon + eyebrow + heading. */
export const PromoCardCell: FC<{ cell: NavCell }> = ({ cell }) => {
  const heading = cell?.header?.heading;
  const eyebrow = cell?.header?.eyebrow;
  const iconUrl = cell?.icon?.url;
  if (!heading && !iconUrl) return null;
  return (
    <div className="mx-4 my-2 flex items-center gap-3 rounded-lg border border-border bg-paper px-4 py-3">
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl}
          alt={cell?.icon?.alt ?? ""}
          className="h-10 w-10 shrink-0 rounded object-contain"
        />
      ) : null}
      <span className="flex flex-col gap-0.5">
        {eyebrow ? (
          <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-accent">
            {eyebrow}
          </span>
        ) : null}
        {heading ? (
          <span className="text-sm font-semibold text-ink">{heading}</span>
        ) : null}
      </span>
    </div>
  );
};

/** Fallback for any cell the storefront does not render. Renders nothing. */
export const UnknownCell: FC<{ cell: NavCell }> = () => null;

/** Cell key -> renderer. Adding a cell type is a one-line change here. */
export const NAV_CELL_REGISTRY: Record<string, FC<{ cell: NavCell }>> = {
  dynlist: CatalogListCell,
  "inline.image": PromoImageCell,
  "inline.card": PromoCardCell,
};

/** Render a cells grid crash-proof: each cell dispatches through the registry;
 * an unregistered key resolves to UnknownCell so the header never throws. */
export const NavCells: FC<{ cells: NavCell[] }> = ({ cells }) => (
  <>
    {cells.map((cell, i) => {
      // `?? UnknownCell` handles both the UNKNOWN_KEY sentinel AND any future
      // registry-key drift (missing entry) - the "never throws" guarantee holds.
      const key = resolveNavCellKey(cell);
      const Renderer = NAV_CELL_REGISTRY[key] ?? UnknownCell;
      return <Renderer key={`${cell?.archetype ?? "cell"}-${i}`} cell={cell} />;
    })}
  </>
);
