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
  peaSeries: "https://pea-series.github.io/",
  // 个人履历（博客页 ProfileCard / About 页展示）
  profile: {
    name: "Bayonetta",
    avatar: "https://avatars.githubusercontent.com/u/3266065?s=200&v=4",
    role: "iOS Native Application Development Engineer",
    tagline: "iOS / macOS · Objective-C / Swift / Flutter",
    location: {
      zh: "石川县金泽市",
      en: "Kanazawa, Ishikawa, Japan",
      ja: "石川県金沢市",
    },
    bio: {
      zh: "专注 iOS / macOS 与前端开发的工程师。",
      en: "Software engineer focused on iOS / macOS and frontend.",
      ja: "iOS / macOS とフロントエンドを専門とするエンジニア。",
    },
    email: "", // 留空则不显示邮箱入口
    twitter: "",
  },
  // 评论系统：Giscus，四项齐备即为启用（2026-11-09 配置完成）。
  // 四项任一为空时 CommentSection 会自动隐藏，不会出现占位框或报错脚本。
  //
  // 参数来自 giscus.app 生成的 <script>，并与 GitHub 公开 API 交叉核对：
  //   repoId = 仓库 node_id = R_kgDOPf0aIw；
  //   categoryId = DIC_kwDOPf0aI84DKuVE，解码后前 6 字节与 repoId 的仓库段
  //   同为 00ce3dfd1a23，确认该分类属于本仓库；仓库 has_discussions=true。
  //
  // CommentSection 在这份配置之上做了三处增强（比 giscus.app 默认代码更适合本站）：
  //   data-theme 跟随站内明暗主题（noborder_dark / noborder_light）；
  //   data-lang 跟随界面语言（zh-CN / en / ja）；
  //   data-loading="lazy"，并固定 data-input-position="top"（长文免得滚到底才能写）。
  //
  // 访客留言需有 GitHub 账号并经 OAuth 授权 Giscus App；也可直接去 GitHub
  // Discussion 里回复。讨论自动创建在 Announcements 分类，只有维护者与 bot 可开新帖。
  giscus: {
    repo: "Bayonetta/bayonetta.github.io",
    repoId: "R_kgDOPf0aIw",
    category: "Announcements",
    categoryId: "DIC_kwDOPf0aI84DKuVE",
    mapping: "pathname",
    reactionsEnabled: "1",
  },
  // Google Analytics (GA4)：通过环境变量 NEXT_PUBLIC_GA_ID 注入
};

// Pea 系列产品索引（/pea 页面展示）。例：{ name: "PeaScribe", desc: "字幕生成器", href: "/" }
export const peaProducts: { name: string; desc: string; href: string }[] = [];

// 首页左上角导航。href 以 http 开头的走外部链接。
// Lyu / Pea 系列已在首页「作品集」展示，不重复出现在导航里。
// hidden: true 的条目暂不渲染，想恢复把该字段改成 false 即可。
// 站内链接写成相对当前文档的路径（./blog），不要写成 /blog：
// 绝对根路径在预览面板的带前缀 URL、file:// 打开、以及部署到子目录时都会跳错。
// comingSoon: true 的条目渲染为按钮而非链接，点击只显示「开发中」提示，不跳转。
export const homeLinks = [
  { id: "github", label: "GitHub", href: site.github, external: true, hidden: false, comingSoon: false },
  { id: "blog", label: "Blog", href: "./blog", external: false, hidden: true, comingSoon: false },
  { id: "gallery", label: "Gallery", href: "./gallery", external: false, hidden: true, comingSoon: true },
] as const;

export type HomeLinkId = (typeof homeLinks)[number]["id"];
