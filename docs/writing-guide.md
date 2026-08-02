# 博客使用教程

这篇文章手把手教你怎么往这个站里写东西。

---

## 1. 写一篇博客

所有博客文章放在 **`content/posts/`** 目录，每篇一个 `.md` 文件。

### 命名规则

```
YYYY-MM-DD-标题.md
```

例：
```
content/posts/
├── 2013-12-12-The_alias_aggregate_of_git_in_zsh.md
├── 2017-2-27-AsyncDisplayKit_use_guide.md
└── 2026-08-03-我的新文章.md
```

日期支持 `2017-2-27` 或 `2017-02-27` 两种写法，标题部分用下划线或字母都行。

### Frontmatter（文件头部的元信息）

```yaml
---
title: "我的新文章"                    # 必填，文章标题
date: "2026-08-03"                     # 必填，日期（也可省略，用文件名日期）
description: "一句话简介，会显示在列表里"  # 可选
tags: [iOS, 开发]                       # 可选，标签数组，用于筛选
category: "Tech"                        # 可选
comments: true                          # 可选，默认开启评论
updated: "2026-08-10"                   # 可选，更新日期
---

这里是正文，写 Markdown 就行……
```

### 正文用 Markdown

支持标准 Markdown + 代码高亮（Shiki）：

````md
# 标题

一段文字，**加粗**、`行内代码`。

```swift
let greeting = "Hello, World!"
print(greeting)
```

> 引用块

- 列表项
- 列表项
````

### 插入图片

图片放到 **`public/images/`**，正文里引用：

```md
![](/images/我的图片.jpg)
```

---

## 2. 横滑图文（图集博客）

在 Markdown 里嵌入 `<ImageGallery>` 组件，就能做出**横向滑动看图 + 每张图带备注**的效果：

```md
## 我的旅行记录

<ImageGallery
  title="富士山之行"
  images={[
    { src: "/images/trip-1.jpg", note: "山脚下的清晨" },
    { src: "/images/trip-2.jpg", note: "河口湖边的落日" },
    { src: "/images/trip-3.jpg", note: "回程的云海" },
  ]}
/>
```

效果：
- 横向滚动，支持触摸滑动 / 鼠标拖拽
- 每张图下方显示序号和备注
- 底部有上一张 / 下一张按钮
- 手机上占屏宽 85%，桌面上固定宽度

> 注意：`src` 用 `/images/xxx.jpg` 这种相对站点的路径；`note` 就是你要写的备注。

---

## 3. Gallery 图集页

图集页展示的是一个独立相册，数据源是 **`content/gallery/manifest.json`**。

### 加一张图

在数组里追加一条：

```json
[
  {
    "src": "/images/我的照片.jpg",
    "title": "2026 夏",
    "note": "海边拍的",
    "date": "2026-07-15"
  }
]
```

字段说明：
| 字段 | 必填 | 说明 |
|------|------|------|
| `src` | ✅ | 图片路径，放 `public/images/` 下 |
| `title` | | 卡片标题 |
| `note` | | 备注文字 |
| `date` | | 展示日期 |

图片建议：横图竖图混排都行，页面会自动瀑布流排版。点击任意图片会打开全屏灯箱，可左右切换、看备注。

---

## 4. 多语言

同一篇文章想写三种语言，用**文件名后缀**区分：

```
content/posts/
├── hello-world.zh.md    ← 中文版
├── hello-world.en.md    ← 英文版
└── hello-world.ja.md    ← 日文版
```

同 slug（去掉后缀的部分）会自动归为同一篇，正文页出现 `中文 / English / 日本語` 切换按钮。

界面文字（导航、按钮、页脚）的三语切换在右上角 `中 / EN / 日`，会自动记忆你的选择。

---

## 5. 本地预览

```bash
npm install        # 首次
npm run dev        # 打开 http://localhost:3000
```

写完直接刷新就能看到效果。构建检查：

```bash
npm run build
```

---

## 6. 部署

一切正常后提交推送，GitHub Actions 会自动构建并部署到 GitHub Pages：

```bash
git add -A
git commit -m "add: 新文章"
git push
```

---

## 常见问题

**Q: 标签筛选和搜索能搜到新文章吗？**  
能。列表页的搜索是全文搜索（会搜正文），标签来自 frontmatter 的 `tags`。

**Q: 评论怎么开？**  
每篇文章默认开评论。前端用的是 Giscus（基于 GitHub Discussions），需要在 `src/lib/site.ts` 里填入你的仓库参数后才会真正显示，否则显示"pending config"占位。

**Q: 首页的导航圈、个人简介在哪改？**  
导航圈和简介在 `src/lib/site.ts`；首页「个人履历」区（教育/学术/作品/兴趣）在 `src/lib/resume.ts`。

### 补充：首页个人履历

首页英雄区往下滚就是履历区，四个模块的数据都在 **`src/lib/resume.ts`** 里配：

| 模块 | 变量 | 格式 |
|------|------|------|
| 教育经历 | `education` | `{ period, school, degree, summary? }`，例：`{ period: "2015.09 — 2019.06", school: "某大学", degree: "计算机 · 学士" }` |
| 学术发表 | `publications` | `{ year, title, venue, authors?, link? }` |
| 作品 | `works` + `series` | 独立项目加进 `works`；Lyu / Pea 系列已固定在 `series`（改链接即可） |
| 兴趣爱好 | `interests` | 字符串数组，如 `["摄影", "滑雪"]` |

某模块留空时，首页对应区域显示「待补充」占位，不影响其他模块。

**Q: 图集横滑的 `<ImageGallery>` 还能传什么？**  
目前支持 `title`（组图标题）和 `images`（每项 `src` + `note`）。够用了。
