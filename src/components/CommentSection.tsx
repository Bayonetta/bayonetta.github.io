"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { site } from "@/lib/site";
import { useLocale } from "@/lib/locale";
import type { Locale } from "@/i18n/types";

const giscusLang: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en",
  ja: "ja",
};

export function CommentSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const { locale } = useLocale();
  const repo = site.giscus.repo;
  const repoId = site.giscus.repoId;
  const categoryId = site.giscus.categoryId;

  useEffect(() => {
    const el = ref.current;
    if (!el || !repo || !repoId || !categoryId) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-repo", repo);
    script.setAttribute("data-repo-id", repoId);
    script.setAttribute("data-category", site.giscus.category);
    script.setAttribute("data-category-id", categoryId);
    script.setAttribute("data-mapping", site.giscus.mapping);
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", site.giscus.reactionsEnabled);
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "top");
    script.setAttribute("data-theme", resolvedTheme === "dark" ? "noborder_dark" : "noborder_light");
    script.setAttribute("data-lang", giscusLang[locale]);
    script.setAttribute("data-loading", "lazy");

    el.innerHTML = "";
    el.appendChild(script);

    return () => {
      el.innerHTML = "";
    };
  }, [repo, repoId, categoryId, resolvedTheme, locale]);

  if (!repo || !repoId || !categoryId) {
    return (
      <div className="card mt-12 flex items-center justify-center px-6 py-10">
        <p className="font-mono text-xs text-faint">
          {/* 评论功能待配置：在 src/lib/site.ts 填入 Giscus 参数 */}
          giscus: pending config
        </p>
      </div>
    );
  }

  return (
    <section data-od-id="comments" className="mt-12 border-t border-line pt-8">
      <div ref={ref} className="min-h-[200px]" />
    </section>
  );
}
