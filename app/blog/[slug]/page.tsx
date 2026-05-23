// app/blog/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPost } from "@/lib/cms/source";

interface Params {
  slug: string;
}

// ISR backstop for detail pages mirrors the index. The per-slug tag
// (emitted by @zwingd-ce/cms-revalidate-nextjs on every blog-post webhook)
// is the primary freshness mechanism; this is the worst-case bound.
export const revalidate = 30;

export default async function BlogPostPage(props: {
  params: Promise<Params>;
}) {
  const { slug } = await props.params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="py-8">
      <Link href="/blog" className="text-sm text-blue-600 hover:underline">
        ← All posts
      </Link>
      <h1 className="mt-4 text-3xl font-semibold">{post.title}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {post.author?.name ?? "Anonymous"} ·{" "}
        {new Date(post.publishedAt).toLocaleDateString()}
      </p>
      {post.contentHtml ? (
        <div
          className="prose prose-slate mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      ) : (
        <p className="mt-6 text-slate-700">{post.excerpt}</p>
      )}
    </article>
  );
}
