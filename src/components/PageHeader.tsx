"use client";

import { useLocale } from "@/lib/locale";

type Section = "blog" | "gallery" | "about" | "pea";

type PageHeaderProps = {
  section: Section;
};

export function PageHeader({ section }: PageHeaderProps) {
  const { t } = useLocale();
  const meta = t[section];

  return (
    <header data-od-id={`page-header-${section}`} className="mb-8">
      <h1 className="font-mono text-4xl font-semibold tracking-tight">
        {meta.title}
      </h1>
      {meta.subtitle && (
        <p className="mt-1.5 text-sm text-muted">{meta.subtitle}</p>
      )}
    </header>
  );
}
