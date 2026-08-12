// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import NavMegaMenu from "@/components/navigation/NavMegaMenu";
import { fetchNavigation } from "@/lib/cms/navigation/fetch-navigation";
import { fetchFooterChrome } from "@/lib/cms/site-chrome/fetch-footer-chrome";

export const metadata: Metadata = {
  title: "Northwind Academy",
  description:
    "Northwind Academy - a Zwingd CMS reference storefront (navigation mega-menu north-star demo).",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // All three chrome reads happen HERE, server-side, and in parallel.
  //
  // Server-side is not a style preference: `next: { tags }` is a server-only
  // fetch option, so a chrome read done from a client component is silently
  // uncacheable AND un-invalidatable. That was the original defect behind the
  // CMS-driven footer work -- see components/layout/Footer.tsx.
  //
  // Parallel because these are independent reads on EVERY page render; awaiting
  // them in sequence would add a round-trip per request for no reason. Each
  // reader degrades to null on its own, so one slow or failing surface cannot
  // take down the others or the page.
  const [nav, footerNav, footerChrome] = await Promise.all([
    fetchNavigation("header"),
    fetchNavigation("footer"),
    fetchFooterChrome(),
  ]);

  return (
    <html lang="en">
      <body>
        <NavMegaMenu nav={nav} />
        <main className="mx-auto max-w-3xl p-6">{children}</main>
        <Footer nav={footerNav} chrome={footerChrome} />
      </body>
    </html>
  );
}
