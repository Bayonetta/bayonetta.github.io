"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/lib/site";

export function SiteFooter() {
  const { t } = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer
      data-od-id="site-footer"
      className="mt-24 border-t border-line py-10"
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-4 px-4 text-xs text-faint sm:flex-row sm:px-6">
        <div className="flex items-center gap-4">
          <span>
            © {year} {site.name} · {t.footer.rights}
          </span>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-muted transition-colors hover:text-fg"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
        <span className="font-mono">
          {t.footer.builtWith}{" "}
          <Link href="/" className="transition-colors hover:text-accent">
            Next.js
          </Link>
        </span>
      </div>
    </footer>
  );
}
