# bayonetta.github.io

Bayonetta 的个人主页 — 技术博客 · 图集 · 系列项目。基于 [Next.js](https://nextjs.org/)、[Tailwind CSS](https://tailwindcss.com/)、TypeScript 构建，SSG 静态导出部署到 GitHub Pages。

## 功能

- **首页**：全屏暗色终端风格 + 5 个圆形导航入口（GitHub / Blog / Gallery / Lyu / Pea）
- **博客列表**：时间线按年分组 + 年份锚点导航、标签筛选、Fuse.js 全文搜索
- **博客正文**：MDX + Shiki 代码高亮、多语言版本切换、Giscus 评论
- **图集**：Markdown 内嵌 `<ImageGallery>` 横滑组件 + 独立图集页
- **三语 UI**：中文 / English / 日本語（顶栏切换，localStorage 记忆）
- **日夜主题**：暗色默认，一键切换并持久化
- **统计**：Google Analytics 4（`NEXT_PUBLIC_GA_ID` 环境变量）

## 本地开发

```bash
npm install
npm run dev       # 开发服务器
npm run build     # 静态导出到 out/
```

## 写文章

1. 在 `content/posts/` 新建 `YYYY-MM-DD-标题.md`。
2. frontmatter 支持 `title` / `date` / `description` / `tags` / `category` / `updated` / `comments`。
3. **多语言**：同一篇文章可用 `slug.zh.md` / `slug.en.md` / `slug.ja.md`，正文页自动出语言切换器。
4. **图集**：正文里嵌入

```md
<ImageGallery
  title="我的旅行"
  images={[
    { src: "/images/a.jpg", note: "备注文字" },
    { src: "/images/b.jpg", note: "另一张" },
  ]}
/>
```

5. 图片放到 `public/images/`，正文用 `![](/images/xxx.jpg)` 引用。

## 图集页

往 `content/gallery/manifest.json` 追加条目（`src` / `title` / `note` / `date`）。

## 评论（Giscus）

在 `src/lib/site.ts` 的 `site.giscus` 填入 repo / repoId / category / categoryId 即可启用。

## 部署

推送 `main` 分支，GitHub Actions 自动构建并部署到 GitHub Pages。

## 项目结构

```
content/posts/         博客 Markdown 文章
content/gallery/       图集页清单 (manifest.json)
public/images/         静态图片
src/app/               页面（index + (content) 路由组）
src/components/        组件（导航/博客/图集/评论等）
src/i18n/              三语词典
src/lib/               数据层与站点配置 (api.ts / site.ts / locale.tsx)
```
