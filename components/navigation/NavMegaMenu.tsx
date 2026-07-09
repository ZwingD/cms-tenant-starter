// components/navigation/NavMegaMenu.tsx
/**
 * The site header + hybrid mega-menu. Renders the server-fetched nav (resolved
 * cells) for the active realm: top-level items as a nav bar; an item carrying a
 * megaMenu reveals a panel on hover/focus (CSS-only, no client state) - left = the
 * curated LinkGroup (children[]), right = the archetype cells grid via <NavCells>.
 * Ported from the Techademy HybridMegaMenu panel (hybrid-mega-menu.tsx), restyled
 * with Northwind tokens. Server component; a plain link when no megaMenu is authored.
 *
 * Introduced: navigation mega-menu north-star demo.
 */
import Link from "next/link";
import type { NavItem, NavResponse } from "@/lib/cms/navigation/types";
import { NavCells } from "./cells";

/** Honor the authored grid width (BE MegaMenuSchema allows 1-6); clamp defensively. */
function clampColumns(n: number | undefined): number {
  return Math.min(Math.max(n ?? 1, 1), 6);
}

const TOP_LINK =
  "px-3 py-2 text-sm font-medium text-primary-foreground/85 transition-colors hover:text-primary-foreground group-focus-within:text-primary-foreground";

function NavItemNode({ item }: { item: NavItem }) {
  const children = item.children ?? [];
  const cells = item.megaMenu?.cells ?? [];

  // No authored mega-menu -> a plain top-level link (header stays clean).
  if (item.megaMenu == null) {
    return (
      <Link href={item.url || "#"} className={TOP_LINK}>
        {item.label}
      </Link>
    );
  }

  return (
    <div className="group relative">
      <button type="button" className={TOP_LINK} aria-haspopup="true">
        {item.label}
      </button>
      {/* Panel: invisible until hover/keyboard-focus within the group (CSS-only). */}
      <div className="invisible absolute left-0 top-full z-20 flex w-[46rem] max-w-[92vw] overflow-hidden rounded-b-xl border border-border bg-paper opacity-0 shadow-xl transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {children.length > 0 && (
          <div className="w-56 shrink-0 border-r border-border bg-muted/60 py-4">
            <span className="block px-5 pb-2 font-display text-sm font-semibold text-ink">
              {item.label}
            </span>
            <nav className="flex flex-col">
              {children.map((child, i) => (
                <a
                  key={child?.url ?? i}
                  href={child?.url ?? "#"}
                  className="px-5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-ink"
                >
                  {child?.label}
                </a>
              ))}
            </nav>
          </div>
        )}
        <div
          className="grid flex-1 gap-2 py-3"
          style={{
            gridTemplateColumns: `repeat(${clampColumns(item.megaMenu?.columns)}, minmax(0, 1fr))`,
          }}
        >
          <NavCells cells={cells} />
        </div>
      </div>
    </div>
  );
}

export default function NavMegaMenu({ nav }: { nav: NavResponse | null }) {
  const items = nav?.items ?? [];
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
        >
          Northwind Academy
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/" className={TOP_LINK}>
            Home
          </Link>
          {items.map((item, i) => (
            <NavItemNode key={item?.label ?? i} item={item} />
          ))}
          <Link href="/blog" className={TOP_LINK}>
            Blog
          </Link>
        </nav>
      </div>
    </header>
  );
}
