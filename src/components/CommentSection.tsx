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

  // 未配置 Giscus 时整节不渲染。以前这里会显示「giscus: pending config」
  // 占位框，在发给招聘方的页面上像一处没做完的功能，反而减分。
  // 想启用评论：按 src/lib/site.ts 里的说明填好 4 个参数，本组件会自动生效，
  // 不需要改动这里或文章 frontmatter。
  if (!repo || !repoId || !categoryId) return null;

  return (
    <section data-od-id="comments" className="mt-12 border-t border-line pt-8">
      <div ref={ref} className="min-h-[200px]" />
    </section>
  );
}
