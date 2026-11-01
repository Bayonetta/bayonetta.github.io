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

// 学术发表：按国际通行格式拆分字段（作者 / 标题 / 会议简称 / 会议全称 / 地点 / 日期）。
// 会议名、地点、日期保留英文原文，符合计算机领域 CV 与 DBLP 的惯例；
// 只有「会议类型」「评审状态」这类说明性文字跟随界面语言。
export type PublicationItem = {
  year: string;
  title: string;
  authors: string;
  venue: string; // 会议简称，如 "AAAC 2026"
  venueFull?: string; // 会议全称
  kind: "international" | "domestic";
  place: string; // 举办地
  date: string; // 会期
  reviewed?: boolean; // 是否同行评审，缺省视为否
  link?: string;
};

// —— 学术发表 ——
export const publications: PublicationItem[] = [
  {
    year: "2026",
    title:
      "Research on the Computational Complexity of Walls and Warriors Puzzle",
    authors: "Shuai Zhao, Tonan Kamata, Ryuhei Uehara",
    venue: "AAAC 2026",
    venueFull:
      "The 17th Annual Meeting of the Asian Association for Algorithms and Computation",
    kind: "international",
    place: "Qingdao, China",
    date: "May 23–24, 2026",
    reviewed: false,
    link: "https://math.ouc.edu.cn/aaac2026/",
  },
  {
    year: "2026",
    title:
      "Research on the Computational Complexity of Walls and Warriors Puzzle",
    authors: "Shuai Zhao, Tonan Kamata, Ryuhei Uehara",
    venue: "SIGAL 207",
    venueFull: "The 207th IPSJ SIGAL Workshop on Algorithms",
    kind: "domestic",
    place: "Okayama, Japan",
    date: "Mar 9, 2026",
    reviewed: false,
    link: "https://www.ipsj.or.jp/kenkyukai/event/al207.html",
  },
];

export type WorkItem = {
  name: string;
  desc: string;
  href: string;
  external?: boolean;
};

// 工作经历：公司名保留原文，职位与概述三语。
export type ExperienceItem = {
  period: string;
  ongoing?: boolean; // true 时渲染为「2026.07 — 至今」
  company: string;
  role: Partial<Record<Locale, string>>;
  summary?: Partial<Record<Locale, string>>;
  stack?: string[];
};

// —— 工作经历 ——
export const experience: ExperienceItem[] = [
  {
    period: "2014.07 — 2018.05",
    company: "Beijing Weico Network Technology Co., Ltd.",
    role: {
      zh: "iOS 应用开发工程师",
      en: "iOS Application Engineer",
      ja: "iOS アプリケーション開発エンジニア",
    },
    summary: {
      zh: "负责 Weibo 第三方 iOS 客户端 Weico 系列的时间线、发布、私信、推送、多账号与深色模式等核心功能；另交付 WeicoNote（Core Data 持久化）、SugarSelfie（AVFoundation / GPUImage 实时滤镜）与 iOS 分享 SDK。后期任 4 人小组 Leader，负责代码评审、技术支援与进度管理，并承担 App Store 发布与审核应对。2015 年 10 月公司更名转籍至 Beijing Weikuqi Information Technology Co., Ltd.。",
      en: "Built core features — timeline, posting, direct messages, push, multi-account, dark mode — for the Weico iOS clients of Weibo, and delivered WeicoNote (Core Data persistence), SugarSelfie (AVFoundation / GPUImage real-time filters) and an iOS share SDK. Later led a 4-person team covering code review, technical support and scheduling, plus App Store release and review handling. Transferred to Beijing Weikuqi Information Technology Co., Ltd. on the company rename in Oct 2015.",
      ja: "Weibo のサードパーティ製 iOS クライアント Weico シリーズにて、タイムライン・投稿・DM・プッシュ通知・複数アカウント・ダークモードなどの主要機能を開発。加えて WeicoNote（Core Data による永続化）、SugarSelfie（AVFoundation / GPUImage によるリアルタイムフィルタ）、iOS 向けシェア SDK を担当。後半は 4 名チームのリーダーとしてコードレビュー、技術支援、進捗管理、App Store リリース・審査対応を担った。2015 年 10 月の社名変更に伴い Beijing Weikuqi Information Technology Co., Ltd. へ転籍。",
    },
    stack: ["Objective-C", "Swift", "AVFoundation", "Core Image", "RxSwift"],
  },
  {
    period: "2026.07",
    ongoing: true,
    company: "Pea Series · Microsoft Store",
    role: {
      zh: "独立开发 · 设计 / 实现 / 发布",
      en: "Independent developer · design, implementation, release",
      ja: "個人開発 · 設計・実装・公開",
    },
    summary: {
      zh: "以 Flutter / Dart 独立设计与发布桌面端应用：PeaPlayer（字幕显示与逐句复读的语学学习播放器）与 PeaScribe（语音转写与字幕制作），Windows 版均已在 Microsoft Store 上架。",
      en: "Designed and shipped two Flutter / Dart desktop apps solo: PeaPlayer (a language-learning media player with subtitles and sentence-level repeat) and PeaScribe (speech transcription and subtitle authoring), both published on the Microsoft Store for Windows.",
      ja: "Flutter / Dart でデスクトップアプリを個人開発・公開。PeaPlayer（字幕表示と文単位リピートを備えた語学学習プレーヤー）と PeaScribe（音声書き起こし・字幕作成）を、いずれも Windows 版として Microsoft Store で公開済み。",
    },
    stack: ["Flutter", "Dart", "Microsoft Store"],
  },
];

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
// 定义见文件开头，此处仅保留数据。

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
// 每项三语（zh / en / ja），缺失语言回退到 zh。加一条只需补一个对象。
export type InterestItem = Partial<Record<Locale, string>>;

export const interests: InterestItem[] = [
  { zh: "类魂游戏", en: "Soulslike games", ja: "ソウルライクゲーム" },
  {
    zh: "挑战困难的事情",
    en: "Tackling hard problems",
    ja: "難しいことへの挑戦",
  },
  { zh: "算法", en: "Algorithms", ja: "アルゴリズム" },
  {
    zh: "组合谜题",
    en: "Combinatorial puzzles",
    ja: "組み合わせパズル",
  },
  { zh: "独立游戏", en: "Indie games", ja: "インディーゲーム" },
];
