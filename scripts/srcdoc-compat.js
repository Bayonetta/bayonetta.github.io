// srcdoc 预览兼容补丁 —— 单一来源，被两处引用：
//   1. src/app/layout.tsx  通过 readFileSync 读入，渲染进 <body> 行内 <script>；
//   2. scripts/inject-srcdoc-compat.js 构建后把它移到每个 HTML 的 <head> 顶部。
// 必须在任何 Next.js 框架脚本之前执行（详见 layout.tsx 中的注释）。
(function () {
  if (window.location.href !== "about:srcdoc") return;
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
  window.history.replaceState = function () { return undefined; };
  window.history.pushState = function () { return undefined; };
})();
