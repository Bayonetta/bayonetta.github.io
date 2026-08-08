// 首页「个人履历」数据配置。
// 每个字段都是数组，往里面加条目即可。留空时首页对应区块显示「待补充」。
import type { Locale } from "@/i18n/types";

export type EducationItem = {
  period: string; // 例："2015.09 — 2019.06"
  // 三语校名 / 学位（zh / en / ja，缺失时回退到 zh）
  school: Partial<Record<Locale, string>>; // 例：{ zh: "某某大学", en: "Some University", ja: "〇〇大学" }
  degree: Partial<Record<Locale, string>>; // 例：{ zh: "学士", en: "Bachelor", ja: "学士" }
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
    school: {
      zh: "华中科技大学 (HUST)",
      en: "Huazhong University of Science and Technology (HUST)",
      ja: "華中科技大学 (HUST)",
    },
    degree: {
      zh: "学士",
      en: "Bachelor",
      ja: "学士",
    },
    summary: {
      zh: "全日制本科",
      en: "Full-time undergraduate",
      ja: "全日制学部課程",
    },
  },
  {
    period: "2024.04 — 2026.03",
    school: {
      zh: "北陆先端科学技术大学院大学 (JAIST)",
      en: "Japan Advanced Institute of Science and Technology (JAIST)",
      ja: "北陸先端科学技術大学院大学 (JAIST)",
    },
    degree: {
      zh: "硕士",
      en: "Master",
      ja: "修士",
    },
    summary: {
      zh: "日本国立大学院",
      en: "National graduate university in Japan",
      ja: "日本の国立大学院",
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
