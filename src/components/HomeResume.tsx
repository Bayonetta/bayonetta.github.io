"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLocale } from "@/lib/locale";
import {
  education,
  experience,
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

function ExperienceList() {
  const { locale, t } = useLocale();
  if (experience.length === 0) return <Empty text="~/experience" />;
  const l = locale as Locale;
  return (
    <ol className="mt-6 space-y-7">
      {experience.map((item, i) => {
        const role = item.role?.[l] ?? item.role?.zh;
        const summary = item.summary?.[l] ?? item.summary?.zh;
        return (
          <li
            key={i}
            className="grid gap-x-8 gap-y-1 sm:grid-cols-[160px_1fr] sm:items-baseline"
          >
            <p className="font-mono text-sm text-accent">
              {item.period}
              {item.ongoing ? ` — ${t.resume.present}` : ""}
            </p>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{item.company}</p>
              {role && <p className="mt-0.5 text-xs text-muted">{role}</p>}
              {summary && (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {summary}
                </p>
              )}
              {item.stack?.length ? (
                <p className="mt-2 font-mono text-[11px] leading-relaxed text-faint">
                  {item.stack.join(" · ")}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// 学术发表：按国际通行格式排版 ——
// 标题 / 作者 / 会议（简称 + 全称）/ 地点 · 会期 · 评审状态；左栏为年份与会议类型。
function PublicationList() {
  const { t } = useLocale();
  if (publications.length === 0) return <Empty text="~/publications" />;
  return (
    <ul className="mt-6 space-y-8">
      {publications.map((item, i) => {
        const kind =
          item.kind === "international"
            ? t.resume.pubKindInternational
            : t.resume.pubKindDomestic;
        return (
          <li
            key={i}
            className="grid gap-x-8 gap-y-1 sm:grid-cols-[160px_1fr] sm:items-baseline"
          >
            <div className="flex items-baseline gap-2 sm:block">
              <p className="font-mono text-sm text-faint">{item.year}</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-faint sm:mt-1">
                {kind}
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-baseline gap-1 transition-colors hover:text-accent"
                  >
                    {item.title}
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-faint transition-colors group-hover:text-accent" />
                  </a>
                ) : (
                  item.title
                )}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {item.authors}
              </p>
              <p className="mt-2 text-xs leading-relaxed">
                <span className="font-medium text-fg">{item.venue}</span>
                {item.venueFull && (
                  <span className="text-muted"> · {item.venueFull}</span>
                )}
              </p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-faint">
                {item.place} · {item.date}
                {item.reviewed === false && ` · ${t.resume.nonReviewed}`}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function InterestList() {
  const { locale } = useLocale();
  if (interests.length === 0) return <Empty text="~/interests" />;
  const l = locale as Locale;
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {interests.map((item, i) => {
        const label = item[l] ?? item.zh;
        if (!label) return null;
        return (
          <span key={`${i}-${label}`} className="chip cursor-default">
            {label}
          </span>
        );
      })}
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

      {/* 工作经历：全行竖向 */}
      <section className="border-t border-line pt-8">
        <SectionTitle label={t.resume.experience} />
        <ExperienceList />
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
