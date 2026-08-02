"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LangToggle } from "@/components/LangToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocale } from "@/lib/locale";

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useLocale();

  const links = [
    { href: "/blog", label: t.nav.blog },
    { href: "/gallery", label: t.nav.gallery },
    { href: "/about", label: t.nav.about },
  ];

  return (
    <header
      data-od-id="site-header"
      className="sticky top-0 z-40 border-b border-line bg-translucent backdrop-blur-md"
    >
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-mono text-sm font-semibold tracking-tight text-fg transition-opacity hover:opacity-70"
        >
          bayonetta
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label="主菜单" className="mr-1 flex items-center gap-0.5">
            {links.map((l) => {
              const active =
                l.href === "/blog"
                  ? pathname === "/blog" || pathname.startsWith("/blog/")
                  : pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-muted hover:bg-surface hover:text-fg"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
