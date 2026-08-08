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
  {
    period: "2010.09 — 2014.06",
    school: "华中科技大学 (HUST)",
    degree: "Bachelor · 学士",
    summary: {
      zh: "全日制本科",
      en: "Full-time undergraduate",
      ja: "全日制学士課程",
    },
  },
  {
    period: "2024.04 — 2026.03",
    school: "北陸先端科学技術大学院大学 (JAIST)",
    degree: "Master · 修士",
    summary: {
      zh: "日本国立大学院 · 修士课程",
      en: "National graduate university in Japan · Master's program",
      ja: "日本の国立大学院 · 修士課程",
    },
  },
];

// —— 学术发表 ——
export const publications: PublicationItem[] = [
  {
    year: "2026",
    title: "Research on the Computational Complexity of Walls and Warriors Puzzle",
    venue: "The 17th Annual Meeting of Asian Association for Algorithms and Computation (AAAC 2026) · May 23–24, 2026 · Qingdao, China · International Conference Paper (Screening / Abstract-reviewed)",
    authors: "Shuai Zhao, Tonan Kamata, Ryuhei Uehara",
  },
];

// —— 独立作品（非系列项目） ——
export const works: WorkItem[] = [
  // 例：
  // { name: "某某工具", desc: "一句话简介", href: "/", external: false },
];

// —— 系列作品 ——
// Lyu / Pea 入口已并入首页顶部的「系列官网」按钮，这里不再重复展示。
// 后续如有新的系列产品，加回即可（会自动出现在首页「作品」栏）。
export const series: WorkItem[] = [];

// —— 兴趣爱好 ——
export const interests: string[] = [
  "Video Games",
  "用 Claude Code 串联一切",
];
