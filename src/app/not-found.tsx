"use client";

import { useLocale } from "@/lib/locale";
import { useSitePrefix } from "@/lib/links";

export default function NotFound() {
  const { t } = useLocale();
  const prefix = useSitePrefix();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-6xl font-semibold tracking-tight text-faint">
        404
      </p>
      <p className="font-mono text-sm text-muted">$ ls: no such file or directory</p>
      <a
        href={prefix}
        className="mt-2 rounded-lg border border-line px-4 py-2 font-mono text-sm text-muted transition-colors hover:border-accent hover:text-accent"
      >
        cd ~
      </a>
      <span className="sr-only">{t.nav.home}</span>
    </div>
  );
}
