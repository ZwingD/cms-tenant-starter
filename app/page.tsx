// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6 py-12">
      <h1 className="text-3xl font-semibold">Welcome.</h1>
      <p className="text-slate-700">
        This is a starter site connected to <strong>Zwingd CMS</strong>.
        Replace this page with your own copy, navigation, and design.
      </p>
      <p className="text-slate-700">
        Visit{" "}
        <Link href="/blog" className="text-blue-600 underline">
          the blog
        </Link>{" "}
        to see the CMS reader in action.
      </p>
    </section>
  );
}
