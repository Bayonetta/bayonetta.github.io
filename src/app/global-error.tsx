"use client";

// 全局错误边界：捕获客户端渲染/水合阶段的异常。
// 默认的 Next.js 错误页只显示笼统提示；这里把真实错误信息与堆栈展示出来，
// 方便排查预览面板 / 线上出现的 "Application error"。
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          background: "#0d1117",
          color: "#e6edf3",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, 'JetBrains Mono', monospace",
          padding: "2rem",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ color: "#8b949e", fontSize: 14, margin: 0 }}>
            <span style={{ color: "#58a6ff" }}>~/bayonetta</span> $ error
          </p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: "0.75rem 0 0.25rem",
              color: "#f85149",
            }}
          >
            Application error — 客户端异常
          </h1>
          <p style={{ color: "#e6edf3", fontSize: 14, margin: "0.5rem 0" }}>
            {error.message || "(无错误消息)"}
          </p>
          {error.digest && (
            <p style={{ color: "#8b949e", fontSize: 12, margin: "0 0 0.75rem" }}>
              digest: {error.digest}
            </p>
          )}
          <pre
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: 6,
              padding: "0.875rem",
              fontSize: 12,
              lineHeight: 1.6,
              overflow: "auto",
              color: "#f0f6fc",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {error.stack || "（无堆栈信息）"}
          </pre>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.125rem",
              background: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "inherit",
            }}
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
