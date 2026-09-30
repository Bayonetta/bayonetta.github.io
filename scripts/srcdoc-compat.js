// srcdoc 预览兼容补丁 —— 单一来源，被两处引用：
//   1. src/app/layout.tsx  通过 readFileSync 读入，渲染进 <body> 行内 <script>；
//   2. scripts/inject-srcdoc-compat.js 构建后把它移到每个 HTML 的 <head> 顶部。
// 必须在任何 Next.js 框架脚本之前执行（详见 layout.tsx 中的注释）。
//
// srcdoc iframe 中 Next.js app router 的三个问题：
//   1. new URL(path, "about:srcdoc") → TypeError：替换 window.URL 构造函数。
//   2. history.replaceState/pushState → SecurityError：用 try/catch 吞掉。
//   3. hydration 后用空树替换 SSR HTML → 黑屏：在 srcdoc 模式下挂起
//      appBootstrap（self.__next_s 设为一个永不 resolve 的条目），
//      让 hydration 永不执行，保留 SSR 静态页面。
//      预览面板以 iframe 嵌入时无需客户端交互，静态渲染即满足查看需求。
(function () {
  if (window.location.href !== "about:srcdoc") return;

  // ── 1. 阻止 hydration（保留 SSR 静态页面）──────────────────
  // appBootstrap 会 reduce self.__next_s 中的脚本条目；条目 [null, null]
  // 既无 src 也无 children，promise 永不 settle → hydrate 永不被调用。
  self.__next_s = [[null, null]];

  // ── 2. URL 构造函数 ──────────────────────────────────────
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

  // ── 3. history 方法（静默吞异常）─────────────────────────
  var _push = window.history.pushState;
  var _replace = window.history.replaceState;
  window.history.pushState = function () {
    try { return _push.apply(this, arguments); } catch (e) {}
  };
  window.history.replaceState = function () {
    try { return _replace.apply(this, arguments); } catch (e) {}
  };
})();
