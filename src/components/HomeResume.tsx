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
import type { Locale } from "@/i18n/types";

function SectionTitle({ label }: { label: string }) {
  return (
    <h3 className="font-mono text-xs font-semibold uppercase tracking-widest text-faint">
      {label}
    </h3>
  );
}

function Empty({ text }: { text: string }) {
  const { t } = useLocale();
  return (
    <p className="mt-5 font-mono text-xs text-faint">
      {text}: {t.resume.empty}
    </p>
  );
}

function EducationList() {
  const { locale } = useLocale();
  if (education.length === 0) return <Empty text="~/education" />;
  const l = locale as Locale;
  return (
    <ol className="mt-6 space-y-7">
      {education.map((item, i) => {
        const school = item.school?.[l] ?? item.school?.zh;
        const degree = item.degree?.[l] ?? item.degree?.zh;
        return (
          <li
            key={i}
            className="grid gap-x-8 gap-y-1 sm:grid-cols-[160px_1fr] sm:items-baseline"
          >
            <p className="font-mono text-sm text-accent">{item.period}</p>
            <div className="min-w-0">
              {school && degree && (
                <p className="text-sm font-medium leading-snug">
                  {school} · {degree}
                </p>
              )}
              {item.summary?.[l] && (
                <p className="mt-1 text-xs text-muted">{item.summary[l]}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function PublicationList() {
  if (publications.length === 0) return <Empty text="~/publications" />;
  return (
    <ul className="mt-6 space-y-6">
      {publications.map((item, i) => (
        <li
          key={i}
          className="grid gap-x-8 gap-y-1 sm:grid-cols-[160px_1fr] sm:items-baseline"
        >
          <p className="font-mono text-sm text-faint">{item.year}</p>
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
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {item.venue}
              {item.authors ? ` · ${item.authors}` : ""}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function InterestList() {
  if (interests.length === 0) return <Empty text="~/interests" />;
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {interests.map((it) => (
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
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
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
    <div data-od-id="home-resume" className="space-y-12">
      {/* 教育经历：全行竖向 */}
      <section className="border-t border-line pt-8">
        <SectionTitle label={t.resume.education} />
        <EducationList />
      </section>

      {/* 学术发表：全行竖向 */}
      <section className="border-t border-line pt-8">
        <SectionTitle label={t.resume.publications} />
        <PublicationList />
      </section>

      {/* 兴趣爱好：全行竖向 */}
      <section className="border-t border-line pt-8">
        <SectionTitle label={t.resume.interests} />
        <InterestList />
      </section>

      {/* 作品集（仅在确有作品时展示） */}
      {works.length + series.length > 0 && (
        <section data-od-id="home-works" className="border-t border-line pt-8">
          <SectionTitle label={t.resume.works} />
          <WorksGrid />
        </section>
      )}
    </div>
  );
}
