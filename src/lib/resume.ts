// 首页「个人履历」数据配置。
// 每个字段都是数组，往里面加条目即可。留空时首页对应区块显示「待补充」。
import type { Locale } from "@/i18n/types";
import { site } from "@/lib/site";

export type EducationItem = {
  period: string; // 例："2015.09 — 2019.06"
  // 三语校名 / 学位（zh / en / ja，缺失时回退到 zh）
  school: Partial<Record<Locale, string>>; // 例：{ zh: "某某大学", en: "Some University", ja: "〇〇大学" }
  degree: Partial<Record<Locale, string>>; // 例：{ zh: "学士", en: "Bachelor", ja: "学士" }
  summary?: Partial<Record<Locale, string>>;
};

// 学术发表：按国际通行格式拆分字段（作者 / 标题 / 会议简称 / 会议全称 / 地点 / 日期）。
// 论文标题、作者署名、会议简称一律保留英文罗马字原文（符合 CV / DBLP 惯例，便于检索与署名核对）；
// 会议全称与举办地提供 zh / en / ja 三语，按界面语言取值，缺失回退 en。
export type PublicationItem = {
  date: string; // 左栏索引，年+月，例 "2026.05"
  title: string; // 论文标题，保留英文原文
  authors: string; // 作者署名，保留英文罗马字
  venue: string; // 会议简称，如 "AAAC 2026"，保留拉丁字母
  venueFull?: Partial<Record<Locale, string>>;
  kind: "international" | "domestic";
  place: Partial<Record<Locale, string>>;
  reviewed?: boolean; // 是否同行评审，缺省视为否
  link?: string;
};

// 两条记录共用同一份英文署名，避免各自维护造成不一致。
const publicationAuthors = "Shuai Zhao, Tonan Kamata, Ryuhei Uehara";

// —— 学术发表 ——
// 按时间从早到晚排列（与教育、工作经历一致）。
export const publications: PublicationItem[] = [
  {
    date: "2026.03",
    title:
      "Research on the Computational Complexity of Walls and Warriors Puzzle",
    authors: publicationAuthors,
    venue: "SIGAL 207",
    venueFull: {
      zh: "信息处理学会第 207 回算法研究会",
      en: "The 207th IPSJ SIGAL Workshop on Algorithms",
      ja: "情報処理学会 第207回アルゴリズム研究会",
    },
    kind: "domestic",
    place: {
      zh: "日本·冈山",
      en: "Okayama, Japan",
      ja: "日本・岡山",
    },
    reviewed: false,
    link: "https://www.ipsj.or.jp/kenkyukai/event/al207.html",
  },
  {
    date: "2026.05",
    title:
      "Research on the Computational Complexity of Walls and Warriors Puzzle",
    authors: publicationAuthors,
    venue: "AAAC 2026",
    venueFull: {
      zh: "第 17 届亚洲算法与计算协会年会",
      en: "The 17th Annual Meeting of the Asian Association for Algorithms and Computation",
      ja: "アジアアルゴリズム・計算学会 第17回年次大会",
    },
    kind: "international",
    place: {
      zh: "中国·青岛",
      en: "Qingdao, China",
      ja: "中国・青島",
    },
    reviewed: false,
    link: "https://math.ouc.edu.cn/aaac2026/",
  },
];

export type WorkItem = {
  name: string;
  desc: Partial<Record<Locale, string>>;
  href: string;
  external?: boolean;
};

// 工作经历：只记时间线上的节点，不展开职责与项目细节。
export type ExperienceItem = {
  period: string; // 例 "2014.07"
  text: Partial<Record<Locale, string>>;
};

// —— 工作经历 ——
// 统一格式：动作 + 公司名。中文用工商登记中文名，英/日沿用英文登记名。
export const experience: ExperienceItem[] = [
  {
    period: "2014.07",
    text: {
      zh: "入职 微酷奥（北京）科技有限公司",
      en: "Joined Beijing Weico Network Technology Co., Ltd.",
      ja: "Beijing Weico Network Technology Co., Ltd. に入社",
    },
  },
  {
    period: "2015.10",
    text: {
      zh: "更名 北京维酷奇信息有限公司",
      en: "Renamed to Beijing Weikuqi Information Technology Co., Ltd.",
      ja: "Beijing Weikuqi Information Technology Co., Ltd. へ社名変更",
    },
  },
  {
    period: "2018.05",
    text: {
      zh: "离职 北京维酷奇信息有限公司",
      en: "Left Beijing Weikuqi Information Technology Co., Ltd.",
      ja: "Beijing Weikuqi Information Technology Co., Ltd. を退社",
    },
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

// —— 独立开发（首页「独立开发」板块） ——
// 两个系列官网，链接与首页顶部按钮同源（src/lib/site.ts）。
export const series: WorkItem[] = [
  {
    name: "Lyu Series",
    desc: {
      zh: "数字健康应用系列：专注力、屏幕自律、体态与视力，HarmonyOS 已上架",
      en: "Digital-wellbeing apps: focus, screen habits, posture and vision",
      ja: "デジタルウェルビーイング系アプリ：集中・スクリーン自律・姿勢・視力",
    },
    href: site.lyuSeries,
    external: true,
  },
  {
    name: "Pea Series",
    desc: {
      zh: "本地优先的学习工具：语言学习播放器 PeaPlayer 与字幕生成器 PeaScribe",
      en: "Local-first learning tools: PeaPlayer and the PeaScribe subtitle generator",
      ja: "ローカルファーストの学習ツール：PeaPlayer と字幕生成 PeaScribe",
    },
    href: site.peaSeries,
    external: true,
  },
];

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
  { zh: "动作游戏", en: "Action games", ja: "アクションゲーム" },
  { zh: "RPG", en: "RPG", ja: "RPG" },
];
