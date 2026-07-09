// components/navigation/NavMegaMenuItem.tsx
"use client";
/**
 * Client disclosure for a nav item that carries a mega-menu. Hardens the
 * north-star CSS-only panel with real a11y + responsive behaviour:
 *
 * - Keyboard/SR: the trigger is a `<button aria-haspopup aria-expanded
 *   aria-controls>`; Escape closes and returns focus to the trigger; a pointer
 *   or focus move outside the item closes it. Click toggles (touch has no hover).
 * - Mouse: hover opens; leaving closes after a short delay so moving into the
 *   panel doesn't dismiss it. `prefers-reduced-motion` disables the fade.
 * - Responsive: the panel stacks to a single column on narrow screens
 *   (`flex-col` + `max-md:!grid-cols-1`) instead of overflowing as a wide grid.
 *
 * The panel content (curated LinkGroup + the archetype cells via <NavCells>) is
 * the server-resolved nav data passed down as props - only the open/close shell
 * is client-side. Mirrors the CSS panel it replaces (NavMegaMenu.tsx).
 *
 * Introduced: navigation mega-menu a11y/responsive hardening pass.
 */
import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, ReactElement } from "react";
import type { NavItem } from "@/lib/cms/navigation/types";
import { NavCells } from "./cells";

/** Honor the authored grid width (BE MegaMenuSchema allows 1-6); clamp defensively. */
function clampColumns(n: number | undefined): number {
  return Math.min(Math.max(n ?? 1, 1), 6);
}

const TOP_LINK =
  "px-3 py-2 text-sm font-medium text-primary-foreground/85 transition-colors hover:text-primary-foreground";

/** Delay before a mouse-leave closes the panel (lets the cursor cross into it). */
const HOVER_CLOSE_MS = 120;

export function NavMegaMenuItem({ item }: { item: NavItem }): ReactElement {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = (): void => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const openMenu = (): void => {
    cancelClose();
    setOpen(true);
  };
  const closeSoon = (): void => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
  };
  const closeNow = (): void => {
    cancelClose();
    setOpen(false);
  };

  // While open: Escape closes + refocuses the trigger; a pointer/focus move
  // outside the item closes it. Listeners attach only while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        closeNow();
        buttonRef.current?.focus();
      }
    };
    const onOutside = (e: Event): void => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        closeNow();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [open]);

  // Clear any pending close timer on unmount.
  useEffect(() => cancelClose, []);

  const children = item.children ?? [];
  const cells = item.megaMenu?.cells ?? [];
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `repeat(${clampColumns(item.megaMenu?.columns)}, minmax(0, 1fr))`,
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeSoon}
    >
      <button
        ref={buttonRef}
        type="button"
        className={`${TOP_LINK}${open ? " text-primary-foreground" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        {item.label}
      </button>
      <div
        id={panelId}
        className={`${
          open ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
        } absolute left-0 top-full z-20 flex w-[46rem] max-w-[92vw] flex-col overflow-hidden rounded-b-xl border border-border bg-paper shadow-xl transition-opacity duration-150 motion-reduce:transition-none md:flex-row`}
      >
        {children.length > 0 && (
          <div className="border-b border-border bg-muted/60 py-4 md:w-56 md:shrink-0 md:border-b-0 md:border-r">
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
          className="grid flex-1 gap-2 py-3 max-md:!grid-cols-1"
          style={gridStyle}
        >
          <NavCells cells={cells} />
        </div>
      </div>
    </div>
  );
}
