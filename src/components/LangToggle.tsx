"use client";

import { useLocale } from "@/lib/locale";
import { locales } from "@/i18n";
import type { Locale } from "@/i18n/types";

const labels: Record<Locale, string> = {
  zh: "中",
  en: "EN",
  ja: "日",
};

export function LangToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="语言切换 / Language"
      className="flex items-center gap-0.5 rounded-md border border-line p-0.5"
    >
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded px-1.5 py-0.5 font-mono text-xs transition-colors ${
            locale === l
              ? "bg-accent-soft text-accent"
              : "text-muted hover:text-fg"
          }`}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}
