// 把 out/<page>.html 打包成「单文件自包含」的预览 HTML。
//
// 背景：Open Design 预览面板通过 http://127.0.0.1:<port>/static-html/<hash>/index.html
// 提供页面，只允许访问该目录下的**顶层文件**，任何子目录（/_next/、images/ 等）
// 一律返回 403。而 Next.js 静态导出用的是绝对路径 /_next/static/...，
// 结果 CSS 与字体全部加载失败，页面退化成无样式的裸 HTML。
//
// 因此这里把样式表（含 @font-face 字体）内联进 <style>，并移除指向 /_next/ 的
// 外链脚本与 preload —— 这些资源在预览面板里必然 404。SSR 出来的 DOM 与
// next-themes 的内联主题脚本都保留，所以视觉与暗色主题不受影响；
// 只是客户端交互（主题/语言切换）在预览中不可用，真实站点仍然完整。
//
// 用法：node scripts/make-preview.js [页面...] [--posts]
//   默认处理 index.html；输出到仓库根目录同名文件。
//   加 --posts 时额外把 out/blog/*.html 平铺为根目录 post-*.html，
//   使单文件预览能从 blog.html 点开文章；不加则根目录只留页面级预览文件。

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const outDir = path.join(root, "out");

const MIME = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

function toDataUri(absPath) {
  const mime = MIME[path.extname(absPath).toLowerCase()] || "application/octet-stream";
  return `data:${mime};base64,${fs.readFileSync(absPath).toString("base64")}`;
}

function inlineStylesheets(html) {
  return html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, (tag) => {
    const href = (tag.match(/href="([^"]+)"/) || [])[1];
    if (!href || !href.startsWith("/")) return tag;
    const abs = path.join(outDir, href.slice(1));
    if (!fs.existsSync(abs)) {
      console.warn(`[make-preview] 样式表缺失，跳过：${href}`);
      return tag;
    }
    let css = fs.readFileSync(abs, "utf8");
    // 字体等资源改内联，否则 /_next/static/media/*.woff2 在预览里取不到
    css = css.replace(/url\((["']?)\/_next\/([^)"']+)\1\)/g, (m, _q, rel) => {
      const asset = path.join(outDir, "_next", rel);
      return fs.existsSync(asset) ? `url(${toDataUri(asset)})` : m;
    });
    return `<style data-inlined-from="${href}">${css}</style>`;
  });
}

function stripNextScripts(html) {
  // 外链 chunk：预览面板下必然 404，留着只会刷控制台错误
  html = html.replace(/<script\b[^>]*\bsrc="\/_next\/[^"]*"[^>]*><\/script>/g, "");
  // preload / prefetch 同理
  html = html.replace(/<link\b[^>]*\bhref="\/_next\/[^"]*"[^>]*>/g, "");
  return html;
}

function relativizeTopLevelAssets(html) {
  // 预览目录本身就是站点根，把顶层静态资源（favicon、根目录图片）改成相对路径
  const TOP_LEVEL = /^\/([^/]+\.(?:ico|png|jpe?g|svg|webp|txt|xml|webmanifest))$/i;
  return html.replace(/\b(href|src)="(\/[^"]+)"/g, (m, attr, url) => {
    const hit = url.match(TOP_LEVEL);
    if (!hit) return m;
    return fs.existsSync(path.join(outDir, hit[1])) ? `${attr}="${hit[1]}"` : m;
  });
}

// 单文件预览（或 file:// 直接打开）既没有服务器的无扩展名回退，
// 也不允许访问子目录，因此把站内链接全部改写到同目录的平铺 .html 文件。
function relativizeInternalPages(html, flattenPosts) {
  const has = (file) => fs.existsSync(path.join(outDir, file));

  // 文章链接：仅在平铺了 post-*.html 时改写；否则保留 ./blog/<slug>，
  // 交给 out/ 的服务器路由处理（单文件预览下这类链接点不开）。
  if (flattenPosts) {
    html = html.replace(
      /\bhref="(?:\.\.?\/|\/)?blog\/([^"/#?]+?)(?:\.html)?"/g,
      (_m, slug) => `href="./post-${slug}.html"`,
    );
  }

  // 顶层页面：./blog、../about、/gallery → ./blog.html 等
  html = html.replace(
    /\bhref="(?:\.\.?\/|\/)?(blog|about|gallery|pea|index)(?:\.html)?\/?"/g,
    (m, page) => (has(`${page}.html`) ? `href="./${page}.html"` : m),
  );

  // 回首页：./、../、/ → ./index.html
  return html.replace(/\bhref="(?:\.\.?\/|\/)"/g, () => 'href="./index.html"');
}

function inlineImages(html) {
  // 站内图片（/images/*.jpg 等）同样位于子目录，预览面板取不到，改成 data URI。
  // 单页上限 16MB。图片最多的台湾游记有 26 张、约 8.3MB 原始体积，
  // 旧的 8MB 预算会让末尾几张退回 /images/ 绝对路径，在预览面板里失效。
  // base64 会再膨胀约 1/3，最终 HTML 约 11MB，仍在可接受范围。
  const IMAGE = /^\/[^"]+\.(?:png|jpe?g|webp|gif|svg|avif)$/i;
  let budget = 16 * 1024 * 1024;
  return html.replace(/\bsrc="(\/[^"]+)"/g, (m, url) => {
    if (!IMAGE.test(url)) return m;
    const abs = path.join(outDir, url.slice(1));
    if (!fs.existsSync(abs)) return m;
    const size = fs.statSync(abs).size;
    if (size > budget) {
      console.warn(`[make-preview] 图片超预算，跳过：${url}`);
      return m;
    }
    budget -= size;
    return `src="${toDataUri(abs)}"`;
  });
}

// 单文件预览剥离了 Next 的 JS，外链的 target="_blank" 在预览面板里可能被静默拦截。
// 注入一段极小的兜底脚本：优先开新窗，被拦截时退回当前窗口跳转。
const EXTERNAL_LINK_FALLBACK = `<script>(function(){document.addEventListener("click",function(e){var a=e.target&&e.target.closest?e.target.closest('a[target="_blank"]'):null;if(!a||!a.href)return;e.preventDefault();var w=window.open(a.href,"_blank");if(w){try{w.opener=null}catch(_){}}else{window.location.href=a.href}},true)})();</script>`;

function build(page, destName, quiet, flattenPosts) {
  const src = path.join(outDir, page);
  if (!fs.existsSync(src)) {
    console.error(`[make-preview] 找不到 ${src}，先执行 npm run build`);
    process.exitCode = 1;
    return;
  }
  let html = fs.readFileSync(src, "utf8");
  html = inlineStylesheets(html);
  html = inlineImages(html);
  html = stripNextScripts(html);
  html = relativizeTopLevelAssets(html);
  html = relativizeInternalPages(html, flattenPosts);
  html = html.replace(/<\/body>/i, `${EXTERNAL_LINK_FALLBACK}</body>`);

  const dest = path.join(root, destName || page);
  fs.writeFileSync(dest, html);

  const leftover = (html.match(/(?:src|href)="\/_next\//g) || []).length;
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
  if (!quiet) {
    console.log(
      `[make-preview] ${page} → ${path.relative(root, dest)}  ${kb} KB` +
        (leftover ? `  ⚠ 仍有 ${leftover} 处 /_next/ 引用` : "  ✓ 无 /_next/ 残留")
    );
  }
}

// 把 out/blog/<slug>.html 平铺为根目录的 post-<slug>.html：
// 单文件预览不允许访问子目录，平铺后每篇文章都能从 blog.html 点开。
function buildBlogPosts() {
  const dir = path.join(outDir, "blog");
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));
  files.forEach((f) => build(`blog/${f}`, `post-${f}`, true, true));
  console.log(`[make-preview] 已平铺 ${files.length} 篇文章 → post-*.html`);
}

const argv = process.argv.slice(2);
const flattenPosts = argv.includes("--posts");
const pages = argv.filter((p) => !p.startsWith("--"));
// 注意：不要直接把 build 传给 forEach（第二个参数 index 会被当成 destName）。
(pages.length ? pages : ["index.html"]).forEach((p) => build(p));
if (flattenPosts) buildBlogPosts();
