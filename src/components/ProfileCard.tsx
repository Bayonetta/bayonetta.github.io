"use client";

import Image from "next/image";
import { Github, MapPin } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { site } from "@/lib/site";
import type { Locale } from "@/i18n/types";

const bioKeys: Record<Locale, keyof typeof site.profile.bio> = {
  zh: "zh",
  en: "en",
  ja: "ja",
};

export function ProfileCard() {
  const { locale, t } = useLocale();
  const { profile } = site;

  return (
    <section
      data-od-id="profile-card"
      className="card flex items-center gap-5 p-5 sm:gap-6 sm:p-6"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-line sm:h-24 sm:w-24">
        <Image
          src={profile.avatar}
          alt={profile.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3">
          <h2 className="font-mono text-lg font-semibold tracking-tight sm:text-xl">
            {profile.name}
          </h2>
          <span className="font-mono text-xs text-faint">@Bayonetta</span>
        </div>
        <p className="mt-0.5 text-sm text-muted">
          {profile.role} · {profile.tagline}
        </p>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted/90">
          {profile.bio[bioKeys[locale]]}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-faint">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {profile.location}
          </span>
          <a
            href={site.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-muted transition-colors hover:text-accent"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
