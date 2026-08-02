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
    <h3 className="mb-4 font-mono text-xs font-semibold uppercase tracking-wider text-faint">
      {label}
    </h3>
  );
}

function Empty({ text }: { text: string }) {
  const { t } = useLocale();
  return (
    <div className="rounded-md border border-dashed border-line px-4 py-8 text-center">
      <p className="font-mono text-xs text-faint">
        {text}: {t.resume.empty}
      </p>
    </div>
  );
}

function EducationList({ items }: { items: EducationItem[] }) {
  const { locale } = useLocale();
  if (items.length === 0) return <Empty text="~/education" />;
  return (
    <ol className="space-y-4 border-l border-line pl-4">
      {items.map((item, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[0.57rem] top-1.5 h-2.5 w-2.5 rounded-full border border-accent bg-bg" />
          <p className="font-mono text-xs text-accent">{item.period}</p>
          <p className="mt-1 text-sm font-medium">
            {item.school} · {item.degree}
          </p>
          {item.summary?.[locale as Locale] && (
            <p className="mt-1 text-xs text-muted">
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
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-baseline gap-3">
          <span className="w-10 shrink-0 font-mono text-xs text-faint">
            {item.year}
          </span>
          <div className="min-w-0">
            {item.link ? (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium leading-snug transition-colors hover:text-accent"
              >
                {item.title}
              </a>
            ) : (
              <p className="text-sm font-medium leading-snug">{item.title}</p>
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

function WorksGrid() {
  const all = [...series, ...works];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {all.map((item) => {
        const inner = (
          <>
            <div>
              <h4 className="font-mono text-sm font-semibold">{item.name}</h4>
              <p className="mt-1 text-sm text-muted">{item.desc}</p>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0 text-faint transition-colors group-hover:text-accent" />
          </>
        );
        return item.external ? (
          <a
            key={item.name}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="card group flex items-center justify-between p-5 transition-colors hover:border-accent"
          >
            {inner}
          </a>
        ) : (
          <Link
            key={item.name}
            href={item.href}
            className="card group flex items-center justify-between p-5 transition-colors hover:border-accent"
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}

export function HomeResume() {
  const { t } = useLocale();

  return (
    <>
      {/* 中部三列：教育 | 发表 | 兴趣（大屏横向并列，移动端竖向） */}
      <div
        data-od-id="home-resume"
        className="grid gap-4 md:grid-cols-3"
      >
        <section className="card p-5">
          <SectionTitle label={t.resume.education} />
          <EducationList items={education} />
        </section>
        <section className="card p-5">
          <SectionTitle label={t.resume.publications} />
          <PublicationList items={publications} />
        </section>
        <section className="card p-5">
          <SectionTitle label={t.resume.interests} />
          <InterestList items={interests} />
        </section>
      </div>

      {/* 作品集 */}
      <section data-od-id="home-works" className="mt-8">
        <SectionTitle label={t.resume.works} />
        <WorksGrid />
      </section>
    </>
  );
}
