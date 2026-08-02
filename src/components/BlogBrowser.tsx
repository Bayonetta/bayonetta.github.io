"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import type { PostMeta } from "@/lib/api";
import { SearchBar } from "@/components/SearchBar";
import { TagFilter } from "@/components/TagFilter";
import { useLocale } from "@/lib/locale";
import type { Locale } from "@/i18n/types";

const langBadge: Record<Locale, string> = {
  zh: "中",
  en: "EN",
  ja: "日",
};

type YearGroup = { year: string; posts: PostMeta[] };

function groupByYear(posts: PostMeta[]): YearGroup[] {
  const map = new Map<string, PostMeta[]>();
  for (const p of posts) {
    const y = p.date.slice(0, 4);
    if (!map.has(y)) map.set(y, []);
    map.get(y)!.push(p);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] > b[0] ? -1 : 1))
    .map(([year, list]) => ({ year, posts: list }));
}

export function BlogBrowser({ posts }: { posts: PostMeta[] }) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: [
          { name: "title", weight: 0.4 },
          { name: "description", weight: 0.25 },
          { name: "searchText", weight: 0.35 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [posts],
  );

  const filtered = useMemo(() => {
    let list = posts;
    if (activeTag) list = list.filter((p) => p.tags.includes(activeTag));
    if (query.trim()) {
      const results = fuse.search(query.trim());
      list = results.map((r) => r.item);
    }
    return list;
  }, [posts, activeTag, query, fuse]);

  // 全部文章的标签（计数基于全量，供筛选导航）
  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) {
      for (const tag of p.tags) {
        map.set(tag, (map.get(tag) || 0) + 1);
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [posts]);

  // 全量年份（导航条稳定不变）
  const allYears = useMemo(
    () => [...new Set(posts.map((p) => p.date.slice(0, 4)))].sort().reverse(),
    [posts],
  );

  const groups = useMemo(() => groupByYear(filtered), [filtered]);

  const hasFilter = query.trim() !== "" || activeTag !== null;

  return (
    <div>
      {/* 搜索 + 导航条（sticky） */}
      <div className="sticky top-14 z-30 -mx-4 bg-translucent px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={t.blog.searchPlaceholder}
        />
        <div className="mt-2.5">
          <TagFilter
            tags={allTags}
            active={activeTag}
            onSelect={setActiveTag}
            allLabel={t.blog.allTags}
          />
        </div>
        <nav
          aria-label={t.blog.yearsTitle}
          className="no-scrollbar -mx-1 mt-2 flex items-center gap-1.5 overflow-x-auto px-1"
        >
          <span className="mr-1 shrink-0 font-mono text-[11px] uppercase tracking-wider text-faint">
            {t.blog.yearsTitle}
          </span>
          {allYears.map((y) => (
            <a
              key={y}
              href={`#year-${y}`}
              className="chip shrink-0 font-mono text-sm font-medium"
            >
              {y}
            </a>
          ))}
        </nav>
      </div>

      {/* 结果计数 */}
      <div className="mt-6 flex items-baseline justify-between">
        <p className="font-mono text-xs text-faint">
          {t.blog.postCount.replace("{count}", String(filtered.length))}
        </p>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActiveTag(null);
            }}
            className="font-mono text-xs text-muted transition-colors hover:text-accent"
          >
            ✕ {t.blog.allTags}
          </button>
        )}
      </div>

      {/* 空态 */}
      {groups.length === 0 && (
        <div className="card mt-4 flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <p className="font-mono text-sm text-muted">{t.blog.emptySearch}</p>
          <p className="font-mono text-xs text-faint">$ grep -r "{query}" ./content</p>
        </div>
      )}

      {/* 时间线 */}
      <div className="mt-8 space-y-12">
        {groups.map(({ year, posts: yearPosts }) => (
          <section
            key={year}
            id={`year-${year}`}
            data-od-id={`timeline-year-${year}`}
            className="scroll-mt-40"
          >
            <h2 className="flex items-baseline gap-3 border-b border-line pb-3">
              <span className="font-mono text-3xl font-semibold tracking-tight">
                {year}
              </span>
              <span className="font-mono text-xs text-faint">
                {yearPosts.length}
              </span>
            </h2>

            <div className="mt-6 space-y-8 border-l border-line pl-5 sm:pl-8">
              {yearPosts.map((post) => (
                <article
                  key={`${post.slug}-${post.locale}`}
                  data-od-id={`post-card-${post.slug}`}
                  className="group relative"
                >
                  <div className="grid grid-cols-[5.5rem_1fr] items-baseline gap-x-4 sm:grid-cols-[6.5rem_1fr]">
                    <time
                      dateTime={post.date}
                      className="font-mono text-xs text-faint"
                    >
                      {post.date.slice(5)}
                    </time>
                    <div className="min-w-0">
                      <h3 className="flex items-center gap-2">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="text-[15px] font-medium leading-snug transition-colors hover:text-accent"
                        >
                          {post.title}
                        </Link>
                        <span
                          className={`shrink-0 rounded border border-line px-1 py-px font-mono text-[10px] leading-none ${
                            post.locale === "zh" ? "text-muted" : "text-accent"
                          }`}
                        >
                          {langBadge[post.locale]}
                        </span>
                      </h3>
                      {post.description && (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                          {post.description}
                        </p>
                      )}
                      {post.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {post.tags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                              data-active={activeTag === tag}
                              className="chip !px-2 !py-px text-[11px]"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
