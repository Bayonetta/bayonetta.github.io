"use client";

import Link from "next/link";
import { ArrowUpRight, FileText, Github, Images } from "lucide-react";
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

export default function Home() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

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

      {/* 顶部控制 */}
      <div className="relative z-10 flex items-center justify-end gap-3 p-5">
        <LangToggle />
        <ThemeToggle />
      </div>

      {/* 品牌区 */}
      <header className="relative z-10 flex flex-col items-center px-6 pb-4 pt-2 text-center">
        <p className="font-mono text-sm text-faint">
          <span className="text-accent">~/bayonetta</span>
          <span className="text-muted"> $ </span>
        </p>
        <h1 className="mt-2 font-mono text-5xl font-semibold tracking-tight md:text-6xl">
          bayonetta
        </h1>
        <p className="mt-3 font-mono text-sm text-muted">
          <span className="text-faint">$</span> whoami{" "}
          <span className="text-faint">→</span>{" "}
          <span className="text-accent">{t.hero.whoamiOut}</span>
        </p>
        <p className="mt-2 text-sm text-muted">{t.hero.tagline}</p>

        {/* 系列官网入口 */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={site.lyuSeries}
            target="_blank"
            rel="noopener noreferrer"
            data-od-id="btn-lyu-series"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-4 py-2 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {t.hero.lyuSite}
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href={site.peaSeries}
            target="_blank"
            rel="noopener noreferrer"
            data-od-id="btn-pea-series"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-4 py-2 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {t.hero.peaSite}
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* 主导航（GitHub / Blog / Gallery） */}
      <nav
        aria-label="主导航"
        className="relative z-10 mx-auto mt-2 flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-6 px-6"
      >
        {homeLinks.map((link) => {
          const Icon = icons[link.id];
          return (
            <Link
              key={link.id}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              data-od-id={`home-circle-${link.id}`}
              className="group flex flex-col items-center gap-3"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full border border-line bg-surface shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-accent group-hover:bg-accent-soft group-hover:shadow-card">
                <Icon className="h-7 w-7 text-muted transition-colors group-hover:text-accent" />
              </span>
              <span className="font-mono text-xs uppercase tracking-wider text-muted transition-colors group-hover:text-fg">
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 中部：全行履历（教育 / 学术 / 兴趣） */}
      <div className="relative z-10 mx-auto mt-12 w-full max-w-3xl flex-1 px-4 sm:px-6">
        <HomeResume />
      </div>

      {/* 页脚 */}
      <footer className="relative z-10 mt-16 flex items-center justify-between border-t border-line px-6 py-4 text-xs text-faint">
        <span>© {year} bayonetta</span>
        <span className="font-mono hidden sm:block">zsh · ∞</span>
      </footer>
    </main>
  );
}
