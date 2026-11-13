"use client";

import { ArrowLeft } from "lucide-react";
import { LangToggle } from "@/components/LangToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocale } from "@/lib/locale";
import { useIsPostPage, useSitePrefix } from "@/lib/links";

// 顶部唯一的返回入口：箭头和文字共用一个胶囊按钮。
// 高度 / 边框 / hover 与右侧 ThemeToggle 一致，字号与间距沿用首页导航按钮，
// 保证「图标 + 等宽文字」在整站是同一套观感。
const backButtonClass =
  "inline-flex h-8 shrink-0 items-center gap-2 rounded-md border border-line px-3 font-mono text-sm text-muted transition-colors hover:border-line-strong hover:text-fg";

export function SiteHeader() {
  const prefix = useSitePrefix();
  const isPost = useIsPostPage();
  const { t } = useLocale();

  // 文章详情页回列表，列表页与其它顶层页回首页。
  // 相对路径规则见 src/lib/links.ts，预览面板 / file:// / 子目录部署都不会跳错。
  const href = isPost ? `${prefix}blog` : prefix;
  const label = isPost ? t.blog.backToList : t.blog.backToHome;

  return (
    <header
      data-od-id="site-header"
      className="sticky top-0 z-40 border-b border-line bg-translucent backdrop-blur-md"
    >
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href={href}
          aria-label={label}
          data-od-id="home-nav-back"
          className={backButtonClass}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </a>

        <div className="flex shrink-0 items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
