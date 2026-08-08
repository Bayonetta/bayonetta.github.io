// 站点级配置：导航、个人信息、社交链接。
// 以后加新产品 / 新入口，只改这里即可。

export const site = {
  name: "Bayonetta",
  fullName: "ZHAO SHUAI",
  title: "Bayonetta · 赵帅",
  description: "个人主页 — 技术博客 · 图集 · 项目",
  url: "https://bayonetta.github.io",
  github: "https://github.com/Bayonetta",
  // 系列官网
  lyuSeries: "https://lyu-series.github.io/",
  peaSeries: "http://pea-series.github.io/",
  // 个人履历（博客页 ProfileCard / About 页展示）
  profile: {
    name: "Bayonetta",
    avatar: "https://avatars.githubusercontent.com/u/3266065?s=200&v=4",
    role: "Software Engineer",
    tagline: "iOS / macOS · Frontend · Tooling",
    location: "Shanghai, China",
    bio: {
      zh: "专注 iOS / macOS 与前端开发的工程师。",
      en: "Software engineer focused on iOS / macOS and frontend.",
      ja: "iOS / macOS とフロントエンドを専門とするエンジニア。",
    },
    email: "", // 留空则不显示邮箱入口
    twitter: "",
  },
  // 评论系统：Giscus 配置（需在 GitHub 启用 Discussions 并安装 Giscus App 后填入）
  giscus: {
    repo: "", // 例： "Bayonetta/bayonetta.github.io"
    repoId: "",
    category: "Announcements",
    categoryId: "",
    mapping: "pathname",
    reactionsEnabled: "1",
  },
  // Google Analytics (GA4)：通过环境变量 NEXT_PUBLIC_GA_ID 注入
};

// Pea 系列产品索引（/pea 页面展示）。例：{ name: "PeaScribe", desc: "字幕生成器", href: "/" }
export const peaProducts: { name: string; desc: string; href: string }[] = [];

// 首页底部导航圈。href 以 http 开头的走外部链接。
// Lyu / Pea 系列已在首页「作品集」展示，不重复出现在导航圈里。
export const homeLinks = [
  { id: "github", label: "GitHub", href: site.github, external: true },
  { id: "blog", label: "Blog", href: "/blog", external: false },
  { id: "gallery", label: "Gallery", href: "/gallery", external: false },
] as const;

export type HomeLinkId = (typeof homeLinks)[number]["id"];
