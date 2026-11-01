// 本地预览服务器：把 out/ 静态导出按 GitHub Pages 的规则伺服。
//
// 为什么需要它：Open Design 的「单文件 HTML」预览只服务顶层文件，/_next/ 子目录
// 一律 403，因此样式、字体、JS 全部失效，主题/语言按钮点了没反应。
// 想验证真实交互（主题切换、语言切换、页面跳转），必须走 HTTP 服务器。
//
// 用法：node scripts/serve-out.js [端口]
// 规则：/blog → /blog.html → /blog/index.html → 404.html（与 Pages 一致）

const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(process.cwd(), "out");
const port = Number(process.argv[2] || process.env.PORT || 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
  ".xml": "application/xml",
};

function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const rel = clean.replace(/^\/+/, "");
  const base = path.join(root, rel);
  if (!base.startsWith(root)) return null; // 防目录穿越
  const candidates = [
    base,
    `${base}.html`,
    path.join(base, "index.html"),
  ];
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      /* 继续尝试下一个 */
    }
  }
  return null;
}

const server = http.createServer((req, res) => {
  const hit = resolveFile(req.url === "/" ? "/index.html" : req.url);
  if (!hit) {
    const notFound = path.join(root, "404.html");
    const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : Buffer.from("404");
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(body);
    console.log(`404 ${req.url}`);
    return;
  }
  const type = MIME[path.extname(hit).toLowerCase()] || "application/octet-stream";
  const body = fs.readFileSync(hit);
  res.writeHead(200, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
  console.log(`200 ${req.url} → ${path.relative(root, hit)}`);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`[serve-out] http://127.0.0.1:${port}  (root: ${root})`);
});
