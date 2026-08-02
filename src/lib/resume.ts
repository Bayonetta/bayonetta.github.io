// 首页「个人履历」数据配置。
// 每个字段都是数组，往里面加条目即可。留空时首页对应区块显示「待补充」。
import type { Locale } from "@/i18n/types";

export type EducationItem = {
  period: string; // 例："2015.09 — 2019.06"
  school: string; // 例："某某大学"
  degree: string; // 例："计算机科学与技术 · 学士"
  summary?: Partial<Record<Locale, string>>;
};

export type PublicationItem = {
  year: string;
  title: string;
  venue: string; // 期刊 / 会议
  authors?: string;
  link?: string;
};

export type WorkItem = {
  name: string;
  desc: string;
  href: string;
  external?: boolean;
};

// —— 教育经历 ——
export const education: EducationItem[] = [
  // 例：
  // {
  //   period: "2015.09 — 2019.06",
  //   school: "某某大学",
  //   degree: "计算机科学与技术 · 学士",
  //   summary: { zh: "…", en: "…", ja: "…" },
  // },
];

// —— 学术发表 ——
export const publications: PublicationItem[] = [
  // 例：
  // {
  //   year: "2024",
  //   title: "A Novel Approach to …",
  //   venue: "IEEE Conference on …",
  //   authors: "S. Zhao, et al.",
  //   link: "https://doi.org/…",
  // },
];

// —— 独立作品（非系列项目） ——
export const works: WorkItem[] = [
  // 例：
  // { name: "某某工具", desc: "一句话简介", href: "/", external: false },
];

// —— 系列作品（Lyu / Pea 固定展示，可增删） ——
export const series: WorkItem[] = [
  {
    name: "Lyu 系列",
    desc: "系列项目主页",
    href: "https://lyu-series.github.io/",
    external: true,
  },
  {
    name: "Pea 系列",
    desc: "系列产品索引",
    href: "/pea",
    external: false,
  },
];

// —— 兴趣爱好 ——
export const interests: string[] = [
  // 例：["摄影", "滑雪", "爵士乐"]
];
