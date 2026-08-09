// srcdoc 预览兼容补丁 —— 单一来源，被两处引用：
//   1. src/app/layout.tsx  通过 readFileSync 读入，渲染进 <body> 行内 <script>；
//   2. scripts/inject-srcdoc-compat.js 构建后把它移到每个 HTML 的 <head> 顶部。
// 必须在任何 Next.js 框架脚本之前执行（详见 layout.tsx 中的注释）。
//
// 补丁处理两个 srcdoc 问题：
//   1. new URL(path, "about:srcdoc") → TypeError：替换 window.URL 构造函数，
//      遇到 about:srcdoc base 时改用有效 origin 解析相对路径。
//   2. history.replaceState/pushState → SecurityError：srcdoc 文档的
//      opaque origin 不允许修改 URL；用 try/catch 吞掉异常，避免 crash，
//      但不彻底 no-op（真实 HTTP 部署必须正常工作）。
//      history.state 在 srcdoc 中不会被写入，Next router 读到 null 后
//      走 fallback 分支，不会报错。
(function () {
  if (window.location.href !== "about:srcdoc") return;

  // ── 1. URL 构造函数 ──────────────────────────────────────
  var base = "http://localhost/";
  try {
    var po = window.parent.location.origin;
    if (/^https?:/i.test(po)) base = po + "/";
  } catch (e) {}
  var NativeURL = window.URL;
  function SafeURL(u, b) {
    try {
      if (b === "about:srcdoc" && typeof u === "string" && !/^[a-z][a-z0-9+.\-]*:/i.test(u)) {
        return new NativeURL(u, base);
      }
      return b === undefined ? new NativeURL(u) : new NativeURL(u, b);
    } catch (e) {
      return new NativeURL(String(u), base);
    }
  }
  SafeURL.prototype = NativeURL.prototype;
  if (NativeURL.createObjectURL) SafeURL.createObjectURL = NativeURL.createObjectURL;
  if (NativeURL.revokeObjectURL) SafeURL.revokeObjectURL = NativeURL.revokeObjectURL;
  window.URL = SafeURL;

  // ── 2. history 方法（静默吞异常，不彻底 no-op）──────────
  var _push = window.history.pushState;
  var _replace = window.history.replaceState;
  window.history.pushState = function () {
    try { return _push.apply(this, arguments); } catch (e) {}
  };
  window.history.replaceState = function () {
    try { return _replace.apply(this, arguments); } catch (e) {}
  };
})();
