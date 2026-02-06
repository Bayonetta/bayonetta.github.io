import Link from 'next/link';
import { getAllPosts } from '@/lib/api';

export default function BlogIndex() {
  const posts = getAllPosts(['slug', 'title', 'date', 'description']);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Journal</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">Blog</h1>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-100"
          >
            ← 回到主页
          </Link>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          {posts.length === 0 ? (
            <p className="text-sm text-slate-400">还没有文章，等你写下第一篇。</p>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group relative flex flex-col space-y-2 border-b border-white/5 pb-6 last:border-none last:pb-0"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <time dateTime={post.date}>{post.date}</time>
                    <span className="h-px w-8 bg-slate-700/60" aria-hidden="true" />
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-50 transition-colors group-hover:text-sky-300">
                    <Link href={`/blog/${post.slug}`}>
                      <span className="absolute inset-0" />
                      {post.title}
                    </Link>
                  </h2>
                  {post.description && (
                    <p className="text-sm leading-relaxed text-slate-200/90 line-clamp-3">
                      {post.description}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
