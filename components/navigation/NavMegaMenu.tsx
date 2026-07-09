// components/navigation/NavMegaMenu.tsx
/**
 * The site header + hybrid mega-menu. Renders the server-fetched nav (resolved
 * cells) for the active realm as a top-level nav bar. A plain link when no
 * megaMenu is authored; an item carrying a megaMenu delegates to the client
 * <NavMegaMenuItem> disclosure (keyboard + aria + responsive - it holds the only
 * client state). Ported from the Techademy HybridMegaMenu panel, restyled with
 * Northwind tokens. Server component (shell); the disclosure island is client.
 *
 * Introduced: navigation mega-menu north-star demo.
 * Hardened: navigation mega-menu a11y/responsive pass (client disclosure).
 */
import Link from "next/link";
import type { NavItem, NavResponse } from "@/lib/cms/navigation/types";
import { NavMegaMenuItem } from "./NavMegaMenuItem";

const TOP_LINK =
  "px-3 py-2 text-sm font-medium text-primary-foreground/85 transition-colors hover:text-primary-foreground";

function NavItemNode({ item }: { item: NavItem }) {
  // No authored mega-menu -> a plain top-level link (header stays clean).
  if (item.megaMenu == null) {
    return (
      <Link href={item.url || "#"} className={TOP_LINK}>
        {item.label}
      </Link>
    );
  }
  // Authored mega-menu -> the client disclosure island (a11y + responsive).
  return <NavMegaMenuItem item={item} />;
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
