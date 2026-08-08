// 构建后脚本：把 srcdoc 预览兼容补丁从 <body> 移到 <head> 顶部。
//
// 背景：Next 静态导出（output: "export"）会把 app router 的框架 chunk 作为
// <head> 里的 async script 输出；Open Design 之类的预览面板还可能把整份
// 导出内联进 srcdoc iframe。这两种情况下，<body> 顶部的行内补丁脚本都可能
// 晚于框架代码执行，导致 `new URL(path, "about:srcdoc")` 抛 "Invalid URL"。
// 因此这里在构建完成后，把 scripts/srcdoc-compat.js 的补丁物理写进每个
// HTML 的 <head> 第一个位置 —— 同步行内脚本，必然先于一切 chunk 执行。
//
// 幂等：head 里已有该补丁时跳过；未找到补丁时告警但不失败。

const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "..", "out");

function collectHtml(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, acc);
    else if (entry.name.endsWith(".html")) acc.push(full);
  }
  return acc;
}

function main() {
  const files = collectHtml(OUT);
  if (files.length === 0) {
    console.warn("[inject-srcdoc-compat] out/ 目录为空，跳过。");
    return;
  }

  const compat = fs.readFileSync(path.join(__dirname, "srcdoc-compat.js"), "utf8");
  const block = `<script>${compat}</script>`;

  let moved = 0;
  let skipped = 0;
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const headEnd = html.indexOf("</head>");
    const bodyStart = html.indexOf("<body");
    if (headEnd === -1 || bodyStart === -1) continue;

    if (html.slice(0, headEnd).includes(block)) {
      skipped++; // 已处理过
      continue;
    }
    if (!html.includes(block)) {
      console.warn(`[inject-srcdoc-compat] 未找到兼容补丁，跳过: ${file}`);
      continue;
    }

    const out = html
      .replace(block, () => "")
      .replace("<head>", () => `<head>${block}`);
    fs.writeFileSync(file, out);
    moved++;
  }

  if (moved === 0 && skipped === 0) {
    console.warn(
      "[inject-srcdoc-compat] 没有 HTML 包含兼容补丁 —— 检查 src/app/layout.tsx 是否仍在渲染它。"
    );
  } else {
    console.log(
      `[inject-srcdoc-compat] ${moved} 个 HTML 已移动补丁到 <head>，${skipped} 个已就位。`
    );
  }
}

main();
