"use client";

import Image from "next/image";
import { Github, Mail, MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useLocale } from "@/lib/locale";
import { site } from "@/lib/site";
import { experience, stack } from "@/lib/about";
import type { Locale } from "@/i18n/types";

export default function AboutPage() {
  const { locale, t } = useLocale();
  const { profile } = site;
  const bio = profile.bio[locale as keyof typeof profile.bio];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <PageHeader section="about" />

      {/* 头像 + 简介 */}
      <section className="card p-6">
        <div className="flex items-center gap-5">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-line">
            <Image src={profile.avatar} alt={profile.name} fill sizes="96px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <h2 className="font-mono text-xl font-semibold">{profile.name}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {profile.role} · {profile.tagline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg/90">{bio}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-line pt-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {profile.location}
          </span>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-accent"
            >
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </a>
          )}
        </div>
      </section>

      {/* 技能栈 */}
      <section className="mt-8">
        <h3 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-faint">
          ~/stack
        </h3>
        <div className="flex flex-wrap gap-2">
          {stack.map((s) => (
            <span key={s} className="chip cursor-default">
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* 履历 */}
      <section className="mt-10">
        <h3 className="mb-4 font-mono text-sm font-semibold uppercase tracking-wider text-faint">
          ~/experience
        </h3>
        {experience.length === 0 ? (
          <div className="card flex items-center justify-center px-6 py-10">
            <p className="font-mono text-xs text-faint">
              $ echo "{t.blog.resumeEmpty}" &gt; experience
            </p>
          </div>
        ) : (
          <ol className="space-y-6 border-l border-line pl-6">
            {experience.map((exp, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 rounded-full border border-accent bg-bg" />
                <p className="font-mono text-xs text-accent">{exp.period}</p>
                <p className="mt-1 text-sm font-medium">
                  {exp.role} · {exp.org}
                </p>
                {exp.summary[locale as Locale] && (
                  <p className="mt-1 text-sm text-muted">
                    {exp.summary[locale as Locale]}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
