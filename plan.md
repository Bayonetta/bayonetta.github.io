# Bayonetta 个人主页重设计 — 规划文档

## 一、意图概要

对现有 Next.js 14 个人博客进行全量重设计，保持 SSG 静态导出部署到 GitHub Pages。  
设计方向：**高水平的程序员审美** — 干净、克制、信息密集但不杂乱。  
类似风格参考：Datadog 文档 / Linear 官网 / VS Code 之暗色系专业工具感。

---

## 二、架构决策（已确认）

### 首页：保留独立首页

首页作为品牌入口 + 导航中枢，5 个圆形导航按钮（GitHub, Blog, Gallery, Lyu, Pea）排列在暗色背景上。  
以后有新产品直接加新圈，结构无需变动。  
首页提供"向下滚动 / 按 ↓ 进入 Blog"的交互（非自动跳转），保持入口体验。

### 图集横滑：确认实现

使用 MDX 自定义组件 `<ImageGallery>`，在 Markdown 中嵌入。  
渲染为 `overflow-x-auto` 水平滚动容器 + 触摸滑动 + 图片下方备注文字。

Markdown 里的写法：
```md
## 我的旅行记录

<ImageGallery
  images={[
    { src: "/images/trip-1.jpg", note: "富士山下的清晨" },
    { src: "/images/trip-2.jpg", note: "河口湖边的落日" }
  ]}
/>
```

这会渲染成一个 `overflow-x-auto` 的水平滚动容器，支持触摸滑动，点击可放大查看。

---

## 三、功能清单

### P0 — 核心功能
- [x] 首页 — 全屏暗色背景 + 5 圆形导航按钮 (GitHub, Blog, Gallery, Lyu 系列, Pea 系列)
- [x] Blog 列表 — 时间倒序 + 按年分组 + 年份导航锚点
- [x] Blog 正文 — MDX 渲染 + 代码高亮 (Shiki 已配置)
- [x] 暗色 / 亮色主题切换（`next-themes`）
- [x] 标签系统 — 每篇文章 tags frontmatter，博客页标签筛选
- [x] 全文搜索 — Fuse.js 客户端搜索
- [x] 三语言支持 — 中文 / English / 日文（UI 词典 + 文章 locale 标记）
- [x] 个人履历 — Blog 页顶部的 profile 卡片

### P1 — 增强功能
- [x] 评论系统 — Giscus（配置完成，待填入 repo 参数）
- [x] Google Analytics 统计（`NEXT_PUBLIC_GA_ID` 环境变量）
- [x] 图集组件 `<ImageGallery>` — 水平滑动 + 备注
- [x] 顶部导航栏 — 固定，含语言切换、主题切换

### P2 — 打磨
- [ ] 文章目录（TOC）侧栏（后续可加）
- [ ] RSS Feed（后续可加）
- [ ] 访问量统计（后续可加）

---

## 四、设计语言

### 色彩系统

使用 `oklch()` 定义。沿用现有暗色基调，加入亮色主题。

- **暗色主题：** `--bg: oklch(0.13 0 0)` (深黑), `--surface: oklch(0.18 0.005 260)` (深灰蓝), `--fg: oklch(0.92 0.01 260)`, `--muted: oklch(0.6 0.01 260)`, `--accent: oklch(0.65 0.18 250)` (冷静蓝)
- **亮色主题：** 白底、浅灰表面、深灰文字
- **字体：** Inter (UI) / JetBrains Mono (代码) — 程序员标配
- **风格原则：** 克制、留白、无 AI 审美污染（无 emoji 图标、无紫色渐变、无圆角左色条卡片、无 unsplash 占位图）

### 设计令牌 (CSS Variables)

```css
:root {
  --bg: oklch(0.98 0 0);
  --surface: oklch(0.95 0.005 260);
  --fg: oklch(0.15 0.01 260);
  --muted: oklch(0.5 0.01 260);
  --border: oklch(0.85 0.01 260);
  --accent: oklch(0.55 0.18 250);
  font-family: Inter, system-ui, sans-serif;
}

.dark {
  --bg: oklch(0.13 0 0);
  --surface: oklch(0.18 0.005 260);
  --fg: oklch(0.92 0.01 260);
  --muted: oklch(0.6 0.01 260);
  --border: oklch(0.25 0.01 260);
  --accent: oklch(0.65 0.18 250);
}
```

---

## 五、文件结构（新增 / 修改）

```
src/
├── app/
│   ├── page.tsx                    ← 首页（重写：导航圈）
│   ├── layout.tsx                  ← 全局布局（重写：添加主题/导航/GA）
│   ├── globals.css                 ← 重写：设计令牌 + Tailwind 扩展
│   ├── blog/
│   │   ├── page.tsx                ← 博客列表（重写：时间线+标签+搜索+履历）
│   │   └── [slug]/
│   │       └── page.tsx            ← 博客正文（增强：TOC/图集支持）
│   ├── about/
│   │   └── page.tsx                ← About（重写）
│   ├── gallery/
│   │   └── page.tsx                ← Gallery（重写）
│   └── lyu/                        ← Lyu 系列汇总页（新增，可选）
├── components/
│   ├── ThemeProvider.tsx            ← 新增：next-themes Provider
│   ├── ThemeToggle.tsx              ← 新增：主题切换按钮
│   ├── NavBar.tsx                   ← 新增：全局导航栏
│   ├── SearchBar.tsx                ← 新增：搜索组件
│   ├── TagFilter.tsx                ← 新增：标签筛选
│   ├── Timeline.tsx                 ← 新增：时间线组件
│   ├── ProfileCard.tsx              ← 新增：个人履历卡片
│   ├── ImageGallery.tsx             ← 新增：图集横滑组件
│   ├── Footer.tsx                   ← 新增：页脚
│   └── CommentSection.tsx           ← 新增：Giscus 评论区
├── lib/
│   ├── api.ts                       ← 增强：支持 tags / locale 筛选
│   ├── posts.ts                     ← 新增：搜索索引生成
│   └── locales.ts                   ← 新增：i18n 字典
├── i18n/                           ← 新增：语言文件
│   ├── zh.ts
│   ├── en.ts
│   └── ja.ts
└── content/
    └── posts/                      ← 增强：支持多语言命名 slug.zh.md / slug.en.md
```

---

## 六、实现步骤

### Phase 1 — 基础设施与设计令牌
1.1 安装新依赖：`next-themes`, `fuse.js`, `giscus`
1.2 重写 `globals.css`：设计令牌 + Tailwind 扩展色
1.3 新建 `ThemeProvider.tsx` + `ThemeToggle.tsx`
1.4 重写 `layout.tsx`：全局 Provider、字体、GA

### Phase 2 — 首页
2.1 重写 `page.tsx`：全屏暗色背景 + 5 圆形导航按钮 + 微动效
2.2 调试：响应式适配

### Phase 3 — 导航与全局组件
3.1 新建 `NavBar.tsx`：固定顶部、半透明、含搜索/主题/语言切换
3.2 新建 `Footer.tsx`
3.3 新建 `ProfileCard.tsx`：个人履历（头像、简介、社交链接）

### Phase 4 — 博客列表页（核心）
4.1 重写 `blog/page.tsx`：时间线布局 + 年份锚点
4.2 新建 `Timeline.tsx`：按年分组渲染
4.3 新建 `TagFilter.tsx`：标签列表 + 点击筛选
4.4 新建 `SearchBar.tsx`：Fuse.js 全文搜索
4.5 集成：搜索 + 标签 + 时间线三联动

### Phase 5 — 博客正文
5.1 增强 `blog/[slug]/page.tsx`：支持 TOC、图集组件注册
5.2 新建 `CommentSection.tsx`：Giscus 集成
5.3 新建 `ImageGallery.tsx`：横滑画廊

### Phase 6 — 多语言
6.1 新建 `src/i18n/` 语言字典
6.2 新建 `src/lib/locales.ts`：useLocale hook
6.3 改造 blog 列表：根据当前语言过滤显示对应文章

### Phase 7 — 打磨
7.1 过渡动画（页面切换 / 主题切换过渡）
7.2 响应式终调
7.3 SEO 优化
7.4 集成测试 + 构建验证

---

## 七、博客三语言设计

### 方案：文件名后缀区分

```
content/posts/
├── hello-world.zh.md    ← 中文版
├── hello-world.en.md    ← 英文版
├── hello-world.ja.md    ← 日文版
├── async-displaykit.zh.md
├── async-displaykit.en.md
└── ...
```

每篇文章通过 frontmatter 中 `locale: "zh"` 标记语言。  
博客页通过 `useLocale()` 筛选显示对应语言的文章，同时保留"显示全部"选项。

### 语言切换 UI

导航栏右侧三个字母按钮：`中` `EN` `日`，点击切换语言。当前语言高亮。

---

## 八、评论 + 分析

### 评论：Giscus（基于 GitHub Discussions）
- 零成本、零数据库
- 访客用 GitHub 账号登录即可评论
- 需要：在 repo 中启用 Discussions → 安装 Giscus App → 获取 `data-repo` 等参数

### 分析：Google Analytics
- 使用 `next/script` + `GA_MEASUREMENT_ID`
- 放在 `layout.tsx` 中

---

## 九、下一步（已确认：保留首页 + 实现图集）

**Phase 1-6 全部完成。** 剩几件需要你操作/确认的事：

1. **部署配置**：仓库已配置 GitHub Actions，push 到 main 即自动部署到 GitHub Pages。已验证 `npm run build` 通过，`out/` 生成正常。
2. **Giscus 评论**：在 GitHub 仓库启用 Discussions → 安装 Giscus App → 把 repo/repoId/categoryId 填入 `src/lib/site.ts`。
3. **Google Analytics**：设置环境变量 `NEXT_PUBLIC_GA_ID`（GitHub Actions secrets 或构建环境）。
4. **多语言文章**：新增多语言文章时用 `slug.zh.md` / `slug.en.md` / `slug.ja.md` 命名，同 slug 会自动出语言切换器。
5. **图集**：博客 Markdown 里用 `<ImageGallery images={[{src, note}]} />`；独立图集页往 `content/gallery/manifest.json` 加条目。
6. **安全提示**：`next@14.1.0` 有已知安全通告，建议后续升级到 patched 版本。

---

*注：原有 9 篇博客文章全部保留。图片 assets 在 `public/images/` 中，原样使用。*