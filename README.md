# Personal Website

A modern, minimalist personal blog built with [Next.js](https://nextjs.org/), [Tailwind CSS](https://tailwindcss.com/), and TypeScript.

## 🚀 Features

- **Modern Tech Stack**: Built with Next.js 14 (App Router) & React.
- **Zero Config**: Static Site Generation (SSG) optimized for GitHub Pages.
- **Markdown Support**: Write posts in standard Markdown (MDX supported).
- **Responsive Design**: Mobile-friendly minimalist UI.
- **Automated Deployment**: GitHub Actions workflow included.

## 🛠️ Getting Started

First, install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📝 How to Write Posts

1. **Create File**: Add a new `.md` file in `content/posts/`.
2. **Naming**: Use the format `YYYY-MM-DD-Title.md` (e.g., `2026-02-06-Hello-World.md`).
3. **Frontmatter**: Add metadata at the top of the file:

```yaml
---
title: "My New Post"
date: "2026-02-06"
description: "A short description for the post list..."
---

Your content here...
```

4. **Images**: Place images in `public/images/` and reference them like `![](/images/filename.jpg)`.

## 📂 Project Structure

- `content/posts/`: Source of truth for your blog posts (Markdown).
- `public/images/`: Static assets like images.
- `src/app/`: Application source code.
  - `page.tsx`: The Landing Page (Full-screen minimalist design).
  - `blog/`: The Blog listing and post detail pages.
- `.github/workflows/`: Automated deployment scripts.

## 🚢 Deployment

This project is configured to deploy automatically to **GitHub Pages**.

1. Push your code to GitHub.
2. Go to **Settings** -> **Pages** in your repository.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. The site will deploy automatically on every push to the `main` branch.
