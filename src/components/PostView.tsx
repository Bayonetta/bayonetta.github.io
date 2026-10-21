"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale";
import type { Locale } from "@/i18n/types";
import { CommentSection } from "@/components/CommentSection";

export type PostVariant = {
  lang: Locale;
  title: string;
  date: string;
  description?: string;
  tags: string[];
  updated?: string;
  readingTime: number;
  comments?: boolean;
  machineTranslated?: boolean;
  content: React.ReactNode;
};

const langNames: Record<Locale, string> = {
  zh: "中文",
  en: "English",
  ja: "日本語",
};

export function PostView({ variants }: { variants: PostVariant[] }) {
  const { locale, t } = useLocale();
  const available = variants.map((v) => v.lang);
  const [lang, setLang] = useState<Locale>(
    available.includes(locale) ? locale : variants[0].lang,
  );

  useEffect(() => {
    if (available.includes(locale)) setLang(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const variant = variants.find((v) => v.lang === lang)!;

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/blog"
        className="mb-8 inline-block font-mono text-sm text-muted transition-colors hover:text-accent"
      >
        ← {t.blog.backToList}
      </Link>

      {/* 多语言版本切换 */}
      {variants.length > 1 && (
        <div
          role="group"
          aria-label="语言版本"
          className="mb-6 flex w-fit items-center gap-0.5 rounded-lg border border-line p-0.5"
        >
          {variants.map((v) => (
            <button
              key={v.lang}
              type="button"
              onClick={() => setLang(v.lang)}
              aria-pressed={lang === v.lang}
              className={`rounded-md px-3 py-1 font-mono text-xs transition-colors ${
                lang === v.lang
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:text-fg"
              }`}
            >
              {langNames[v.lang]}
            </button>
          ))}
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {variant.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-faint">
          <time dateTime={variant.date}>{variant.date}</time>
          <span aria-hidden="true">·</span>
          <span>
            {t.blog.readingTime.replace("{min}", String(variant.readingTime))}
          </span>
          {variant.updated && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                {t.blog.updatedAt} {variant.updated}
              </span>
            </>
          )}
        </div>
        {variant.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {variant.tags.map((tag) => (
              <span key={tag} className="chip cursor-default">
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose max-w-none">{variant.content}</div>

      {variant.machineTranslated && (
        <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-faint">
          {t.blog.machineTranslation}
        </p>
      )}

      {variant.comments !== false && <CommentSection key={lang} />}
    </article>
  );
}
