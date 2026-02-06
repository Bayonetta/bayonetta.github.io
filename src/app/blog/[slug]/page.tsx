import { getPostBySlug, getAllPosts } from '@/lib/api';
import { mdxOptions } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const posts = getAllPosts(['slug']);
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug, ['title', 'date', 'slug', 'content']);

  if (!post) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-3xl">
        <header className="mb-10">
          <Link
            href="/blog"
            className="mb-4 inline-block text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
          >
            ← 返回博客列表
          </Link>
          <h1 className="mb-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
            {post.title}
          </h1>
          <time dateTime={post.date} className="text-sm text-slate-400">
            {post.date}
          </time>
        </header>

        <div className="prose prose-invert prose-lg prose-slate mx-auto">
          <MDXRemote source={post.content} options={mdxOptions} />
        </div>
      </article>
    </div>
  );
}
