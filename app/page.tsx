// app/page.tsx
import Link from "next/link";
import { blogSource } from "@/lib/cms/env";

export default function HomePage() {
  const source = blogSource();
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
      <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Blog source mode: <code className="font-mono">{source}</code>
        {source === "STATIC" ? (
          <p className="mt-2 text-xs">
            Currently serving baked-in sample posts. Set{" "}
            <code className="font-mono">CMS_BLOG_SOURCE=CMS</code> in your
            Vercel env vars once you&apos;ve registered the webhook in
            Zwingd CMS admin to switch to live content. See the README.
          </p>
        ) : (
          <p className="mt-2 text-xs">
            Live CMS reads enabled. Edits in Zwingd CMS will revalidate
            this site within ~30s.
          </p>
        )}
      </div>
    </section>
  );
}
