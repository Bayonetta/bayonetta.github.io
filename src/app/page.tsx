"use client";

import Link from "next/link";
import { FileText, FolderKanban, Github, Images, Sprout } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LangToggle } from "@/components/LangToggle";
import { HomeResume } from "@/components/HomeResume";
import { useLocale } from "@/lib/locale";
import { homeLinks } from "@/lib/site";
import type { HomeLinkId } from "@/lib/site";

const icons: Record<HomeLinkId, typeof Github> = {
  github: Github,
  blog: FileText,
  gallery: Images,
  lyu: FolderKanban,
  pea: Sprout,
};

export default function Home() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <main>
      {/* ===== 英雄区 ===== */}
      <section className="relative flex min-h-screen flex-col overflow-hidden">
        {/* 背景：网格 + 径向 accent 光晕 */}
        <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 36%, color-mix(in oklab, var(--accent) 10%, transparent), transparent 72%)",
          }}
        />

        {/* 顶部控制 */}
        <div className="relative z-10 flex items-center justify-end gap-3 p-5">
          <LangToggle />
          <ThemeToggle />
        </div>

        {/* 主体 */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16">
          <div className="flex flex-col items-center text-center">
            <p className="font-mono text-sm text-faint">
              <span className="text-accent">~/bayonetta</span>
              <span className="text-muted"> $ </span>
            </p>
            <h1 className="mt-2 font-mono text-5xl font-semibold tracking-tight md:text-7xl">
              bayonetta
            </h1>
            <p className="mt-4 font-mono text-sm text-muted md:text-base">
              <span className="text-faint">$</span> whoami{" "}
              <span className="text-faint">→</span>{" "}
              <span className="text-accent">{t.hero.whoamiOut}</span>
            </p>
            <p className="mt-3 text-sm text-muted">{t.hero.tagline}</p>
          </div>

          {/* 导航圈 */}
          <nav
            aria-label="主导航"
            className="mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-8"
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

          {/* 向下滚动到履历 */}
          <a
            href="#resume"
            className="mt-16 inline-flex items-center gap-2 font-mono text-sm text-faint transition-colors hover:text-accent"
          >
            {t.hero.scrollHint}
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </section>

      {/* ===== 个人履历 ===== */}
      <HomeResume />

      {/* ===== 页脚 ===== */}
      <footer className="flex items-center justify-between border-t border-line px-6 py-4 text-xs text-faint">
        <span>© {year} bayonetta</span>
        <span className="font-mono hidden sm:block">zsh · ∞</span>
      </footer>
    </main>
  );
}
