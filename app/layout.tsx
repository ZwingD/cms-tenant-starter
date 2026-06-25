// app/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zwingd Tenant Starter",
  description:
    "Starter Next.js storefront wired to Zwingd CMS via @zwingd-ce/cms-revalidate-nextjs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200">
          <div className="mx-auto flex max-w-3xl items-center justify-between p-6">
            <Link href="/" className="text-lg font-semibold">
              Your Tenant Site
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:underline">
                Home
              </Link>
              <Link href="/blog" className="hover:underline">
                Blog
              </Link>
              <Link
                href="/courses/value-investing-101"
                className="hover:underline"
              >
                Courses
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl p-6">{children}</main>
        <footer className="mt-16 border-t border-slate-200">
          <div className="mx-auto max-w-3xl p-6 text-xs text-slate-500">
            Powered by{" "}
            <a
              href="https://github.com/ZwingD/cms-revalidate-nextjs"
              className="underline"
            >
              @zwingd-ce/cms-revalidate-nextjs
            </a>
            . Replace this footer with your own.
          </div>
        </footer>
      </body>
    </html>
  );
}
