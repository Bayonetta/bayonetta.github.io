"use client";

import { useEffect, useState } from "react";
import { FileText, Github, Images } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { HomeResume } from "@/components/HomeResume";
import { useLocale } from "@/lib/locale";
import { homeLinks, site } from "@/lib/site";
import type { HomeLinkId } from "@/lib/site";

const icons: Record<HomeLinkId, typeof Github> = {
  github: Github,
  blog: FileText,
  gallery: Images,
};

// 所有导航按钮（含只显示提示的 Gallery）共用同一份样式，保证外观完全一致。
const navButtonClass =
  "inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3.5 py-2 font-mono text-sm text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent";

export default function Home() {
  const { t } = useLocale();
  const year = new Date().getFullYear();
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    if (!showComingSoon) return;
    const timer = window.setTimeout(() => setShowComingSoon(false), 2600);
    return () => window.clearTimeout(timer);
  }, [showComingSoon]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* 背景：网格 + 顶部径向光晕 */}
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 50% 0%, color-mix(in oklab, var(--accent) 9%, transparent), transparent 70%)",
        }}
      />

      {/* 顶部控制：左侧主导航（GitHub / Blog / Gallery），右侧语言与主题 */}
      <div className="relative z-10 flex items-center justify-between gap-3 px-5 py-4">
        <nav aria-label="主导航" className="relative flex flex-wrap items-center gap-2">
          {homeLinks
            .filter((link) => !link.hidden)
            .map((link) => {
              const Icon = icons[link.id];
              const domId = `home-nav-${link.id}`;
              const inner = (
                <>
                  <Icon className="h-4 w-4" />
                  <span className="uppercase tracking-wide">{link.label}</span>
                </>
              );
              // comingSoon 项渲染为按钮：点击只在下方显示提示，不做任何跳转。
              if (link.comingSoon) {
                return (
                  <span key={domId} className="relative inline-flex">
                    <button
                      type="button"
                      onClick={() => setShowComingSoon(true)}
                      aria-describedby={showComingSoon ? "home-coming-soon" : undefined}
                      data-od-id={domId}
                      className={navButtonClass}
                    >
                      {inner}
                    </button>
                    {showComingSoon && (
                      <span
                        id="home-coming-soon"
                        role="status"
                        className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-xs text-muted shadow-sm"
                      >
                        {t.gallery.comingSoon}
                      </span>
                    )}
                  </span>
                );
              }
              // 用原生 a 而非 next/link：客户端路由会把相对 href 重新解析成
              // 站点根下的绝对路径，在预览面板 / file:// / 子目录部署时又会跳错。
              return (
                <a
                  key={domId}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  data-od-id={domId}
                  className={navButtonClass}
                >
                  {inner}
                </a>
              );
            })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* 品牌区 */}
      <header className="relative z-10 flex flex-col items-center px-6 pb-4 pt-2 text-center">
        <p className="font-mono text-sm text-faint">
          <span className="text-accent">~/bayonetta</span>
          <span className="text-muted"> $ </span>
        </p>
        <h1 className="mt-2 font-mono text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
          {site.fullName}
        </h1>
        <p className="mt-3 font-mono text-sm text-muted">
          <span className="text-faint">$</span> whoami{" "}
          <span className="text-faint">→</span>{" "}
          <span className="text-accent">{t.hero.whoamiOut}</span>
        </p>
        <p className="mt-2 text-sm text-muted">{t.hero.tagline}</p>
      </header>

      {/* 中部：全行履历（教育 / 学术 / 兴趣） */}
      <div className="relative z-10 mx-auto mt-10 w-full max-w-3xl flex-1 px-4 sm:px-6">
        <HomeResume />
      </div>

      {/* 页脚 */}
      <footer className="relative z-10 mt-16 flex items-center justify-center border-t border-line px-6 py-4 text-center text-xs text-faint">
        <span>© {year} Bayonetta. All rights reserved.</span>
      </footer>
    </main>
  );
}
