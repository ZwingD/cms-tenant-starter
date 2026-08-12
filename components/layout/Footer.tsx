// components/layout/Footer.tsx
/**
 * The CMS-driven site footer: link columns from Navigation(FOOTER), plus social
 * links, legal links and copyright from the site-chrome footer blob.
 *
 * PURELY PRESENTATIONAL -- it fetches nothing. The root layout does both reads
 * server-side and passes the results down. That split is deliberate and
 * load-bearing: the moment a footer fetch moves into a component that could
 * become a client component, Next's `next: { revalidate, tags }` options go
 * inert and the footer can never be cache-invalidated again. That exact defect
 * (a `useEffect` chrome fetch) is what prompted this whole workstream, so do NOT
 * add "use client", state, or effects to anything in this file's tree.
 *
 * EMPTY SLOTS RENDER NOTHING. Every slot is independently conditional and the
 * component returns null when no slot has content. This is what makes the
 * contract adoptable: a tenant that uses only link columns gets exactly link
 * columns -- no empty containers, no orphan separators, no layout break.
 *
 * Introduced: CMS-driven footer.
 * Plan: cms-backend/docs/plans/2026-08-12-platform-footer-tenant-onboarding.md Task 3
 */
import { safeHref } from "@/lib/cms/site-chrome/normalize-footer-chrome";
import type { FooterChrome } from "@/lib/cms/site-chrome/types";
import type { NavChild, NavItem, NavResponse } from "@/lib/cms/navigation/types";

export interface FooterProps {
  /** Navigation(FOOTER) delivery response, or null when the CMS is unreachable. */
  nav: NavResponse | null;
  /** Normalized footer chrome, or null when the CMS is unreachable. */
  chrome: FooterChrome | null;
}

/**
 * A footer nav item is a link column: `label` is the heading, `children[]` the
 * links. `#` is the conventional "this heading does not navigate" placeholder
 * (the seeded footer nav uses it), so it is treated as no destination.
 *
 * Nav hrefs go through the SAME `safeHref` allowlist as the chrome links. They
 * arrive from a different CMS surface (the Navigation items JSONB rather than
 * the site-chrome blob) but land in exactly the same `<a href={...}>`, so
 * hardening only the chrome path would leave an identical hole open.
 */
function headingHref(item: NavItem): string | null {
  const url = safeHref(item.url);
  return url && url.trim() !== "#" ? url : null;
}

/** Child links whose destination survives the scheme allowlist. */
function usableChildren(item: NavItem): Array<NavChild & { href: string }> {
  if (!Array.isArray(item.children)) return [];
  return item.children.flatMap((child) => {
    const href = safeHref(child?.url);
    return child?.label && href ? [{ ...child, href }] : [];
  });
}

/** Columns worth rendering: anything carrying links OR its own destination. */
function usableColumns(nav: NavResponse | null): NavItem[] {
  if (!nav || !Array.isArray(nav.items)) return [];
  return nav.items.filter(
    (item) =>
      item?.label &&
      (usableChildren(item).length > 0 || headingHref(item) !== null),
  );
}

export default function Footer({ nav, chrome }: FooterProps) {
  const columns = usableColumns(nav);
  const socialLinks = chrome?.socialLinks ?? [];
  const legalLinks = chrome?.legalLinks ?? [];

  // The `(c) <year>` fallback is the platform convention, not a local choice:
  // FooterConfigSchema relaxed `copyright` from .min(1) to allow "" precisely
  // BECAUSE storefronts fall back this way (BUG-010, Sprint 15). It applies only
  // when chrome was actually delivered -- a null chrome means the CMS is
  // unreachable, and inventing a copyright line for absent data would be a
  // fabricated slot rather than a documented default.
  const copyright = chrome
    ? chrome.copyright || `© ${new Date().getFullYear()}`
    : null;

  const hasContent =
    columns.length > 0 ||
    socialLinks.length > 0 ||
    legalLinks.length > 0 ||
    copyright !== null;
  if (!hasContent) return null;

  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto max-w-3xl space-y-8 p-6">
        {columns.length > 0 && (
          <nav aria-label="Footer" className="flex flex-wrap gap-x-12 gap-y-8">
            {columns.map((column) => {
              const href = headingHref(column);
              const children = usableChildren(column);
              return (
                <div key={column.label} className="min-w-[8rem]">
                  <h2 className="font-display text-sm font-semibold text-ink">
                    {href ? (
                      <a className="hover:text-primary" href={href}>
                        {column.label}
                      </a>
                    ) : (
                      column.label
                    )}
                  </h2>
                  {children.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {children.map((child) => (
                        <li key={`${child.label}-${child.href}`}>
                          <a
                            className="inline-block py-1 text-sm text-muted-foreground hover:text-primary"
                            href={child.href}
                          >
                            {child.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>
        )}

        {socialLinks.length > 0 && (
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {socialLinks.map((link) => (
              <li key={link.platform}>
                <a
                  className="inline-block py-1 text-sm capitalize text-muted-foreground hover:text-primary"
                  href={link.href}
                  rel="noreferrer noopener"
                  target="_blank"
                >
                  {link.platform}
                </a>
              </li>
            ))}
          </ul>
        )}

        {(legalLinks.length > 0 || copyright !== null) && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6">
            {copyright !== null && (
              <p className="text-xs text-muted-foreground">{copyright}</p>
            )}
            {legalLinks.length > 0 && (
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {legalLinks.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <a
                      className="inline-block py-1 text-xs text-muted-foreground hover:text-primary"
                      href={link.href}
                      {...(link.openInNewTab
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </footer>
  );
}
