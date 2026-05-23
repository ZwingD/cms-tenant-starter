// app/blog/page.tsx
import Link from "next/link";
import { getBlogIndex } from "@/lib/cms/source";

/**
 * ISR backstop — bounds the worst-case staleness at 30 seconds if a
 * webhook tag invalidation ever drops or arrives at a cached HTML that
 * predates the tag-instrumented build.
 *
 * Lesson from feezy.one (issue #3 / L-10): without this, a cached
 * index HTML could be served indefinitely if the tag invalidation
 * race fired against an empty tag set.
 */
export const revalidate = 30;

export default async function BlogIndexPage() {
  const posts = await getBlogIndex();
  return (
    <section className="py-8">
      <h1 className="mb-6 text-3xl font-semibold">Blog</h1>
      {posts.length === 0 ? (
        <p className="text-slate-600">No posts yet.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((p) => (
            <li
              key={p.id}
              className="border-b border-slate-200 pb-6 last:border-0"
            >
              <Link
                href={`/blog/${p.slug}`}
                className="text-xl font-semibold text-blue-600 hover:underline"
              >
                {p.title}
              </Link>
              {p.excerpt && (
                <p className="mt-2 text-slate-700">{p.excerpt}</p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                {p.author?.name ?? "Anonymous"} ·{" "}
                {new Date(p.publishedAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
