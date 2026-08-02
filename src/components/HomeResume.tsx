"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import {
  education,
  interests,
  publications,
  series,
  works,
} from "@/lib/resume";
import type { EducationItem, PublicationItem } from "@/lib/resume";
import type { Locale } from "@/i18n/types";

function SectionTitle({ label }: { label: string }) {
  return (
    <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-faint">
      {label}
    </h3>
  );
}

function Empty({ text }: { text: string }) {
  const { t } = useLocale();
  return (
    <div className="card flex items-center justify-center px-6 py-8">
      <p className="font-mono text-xs text-faint">
        {text}: {t.resume.empty} · {t.resume.editHint}
      </p>
    </div>
  );
}

function EducationList({ items }: { items: EducationItem[] }) {
  const { locale } = useLocale();
  if (items.length === 0) return <Empty text="~/education" />;
  return (
    <ol className="space-y-6 border-l border-line pl-6">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[0.57rem] top-1.5 h-2.5 w-2.5 rounded-full border border-accent bg-bg" />
          <p className="font-mono text-xs text-accent">{item.period}</p>
          <p className="mt-1 text-sm font-medium">
            {item.school} · {item.degree}
          </p>
          {item.summary?.[locale as Locale] && (
            <p className="mt-1 text-sm text-muted">
              {item.summary[locale as Locale]}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function PublicationList({ items }: { items: PublicationItem[] }) {
  if (items.length === 0) return <Empty text="~/publications" />;
  return (
    <ul className="space-y-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-baseline gap-4">
          <span className="w-12 shrink-0 font-mono text-xs text-faint">
            {item.year}
          </span>
          <div className="min-w-0">
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors hover:text-accent"
              >
                {item.title}
              </a>
            ) : (
              <p className="text-sm font-medium">{item.title}</p>
            )}
            <p className="mt-0.5 text-xs text-muted">
              {item.venue}
              {item.authors ? ` · ${item.authors}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function WorksGrid() {
  const all = [...series, ...works];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {all.map((item) =>
        item.external ? (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="card group flex items-center justify-between p-5 transition-colors hover:border-accent"
          >
            <div>
              <h4 className="font-mono text-sm font-semibold">{item.name}</h4>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-faint transition-colors group-hover:text-accent" />
          </a>
        ) : (
          <Link
            key={item.name}
            href={item.href}
            className="card group flex items-center justify-between p-5 transition-colors hover:border-accent"
          >
            <div>
              <h4 className="font-mono text-sm font-semibold">{item.name}</h4>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-faint transition-colors group-hover:text-accent" />
          </Link>
        ),
      )}
    </div>
  );
}

function InterestList({ items }: { items: string[] }) {
  if (items.length === 0) return <Empty text="~/interests" />;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <span key={it} className="chip cursor-default">
          {it}
        </span>
      ))}
    </div>
  );
}

export function HomeResume() {
  const { t } = useLocale();

  return (
    <section
      data-od-id="home-resume"
      id="resume"
      className="relative border-t border-line"
    >
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="font-mono text-2xl font-semibold tracking-tight">
          {t.resume.title}
        </h2>

        {/* 教育经历 */}
        <div className="mt-10">
          <SectionTitle label={t.resume.education} />
          <EducationList items={education} />
        </div>

        {/* 学术发表 */}
        <div className="mt-10">
          <SectionTitle label={t.resume.publications} />
          <PublicationList items={publications} />
        </div>

        {/* 作品 */}
        <div className="mt-10">
          <SectionTitle label={t.resume.works} />
          <WorksGrid />
        </div>

        {/* 兴趣爱好 */}
        <div className="mt-10">
          <SectionTitle label={t.resume.interests} />
          <InterestList items={interests} />
        </div>
      </div>
    </section>
  );
}
