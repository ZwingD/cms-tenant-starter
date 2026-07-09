// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import NavMegaMenu from "@/components/navigation/NavMegaMenu";
import { fetchNavigation } from "@/lib/cms/navigation/fetch-navigation";

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
  const nav = await fetchNavigation("header");
  return (
    <html lang="en">
      <body>
        <NavMegaMenu nav={nav} />
        <main className="mx-auto max-w-3xl p-6">{children}</main>
        <footer className="mt-16 border-t border-border">
          <div className="mx-auto max-w-3xl p-6 text-xs text-muted-foreground">
            Powered by{" "}
            <a
              href="https://github.com/ZwingD/cms-revalidate-nextjs"
              className="underline"
            >
              @zwingd-ce/cms-revalidate-nextjs
            </a>
            .
          </div>
        </footer>
      </body>
    </html>
  );
}
