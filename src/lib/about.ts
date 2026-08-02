// About 页内容配置。experience 为空时页面会显示「待补充」空态。
import type { Locale } from "@/i18n/types";

export type ExperienceItem = {
  period: string;
  role: string;
  org: string;
  summary: Partial<Record<Locale, string>>;
};

// 技能栈（根据博客主题归纳，可自行增删）
export const stack: string[] = [
  "iOS",
  "Objective-C",
  "Swift",
  "React",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Flutter",
  "Git",
  "zsh",
];

export const experience: ExperienceItem[] = [
  // 例：
  // {
  //   period: "2018 — now",
  //   role: "Senior iOS Engineer",
  //   org: "某公司",
  //   summary: { zh: "负责…", en: "…", ja: "…" },
  // },
];
