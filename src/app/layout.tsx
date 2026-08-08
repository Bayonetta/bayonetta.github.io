import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { readFileSync } from "fs";
import { join } from "path";
import Script from "next/script";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LocaleProvider } from "@/lib/locale";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// 预览面板（如 Open Design）以 about:srcdoc 注入页面时：
// - location.href 是 "about:srcdoc"，无法作为相对路径的 base，
//   Next.js 内部 new URL(path, location.href) 会抛 "Invalid URL"；
// - 浏览器禁止在 srcdoc 文档里 replaceState/pushState 修改 URL。
// 这里仅在 srcdoc 场景打补丁，正常部署的 HTTP 页面完全不受影响。
//
// 兼容脚本本体在 scripts/srcdoc-compat.js（单一来源，避免两份拷贝漂移）。
// 它必须早于任何 Next 框架脚本执行，因此构建后由
// scripts/inject-srcdoc-compat.js 把它从 <body> 移到每个 HTML 的 <head> 顶部。
// 注意：不要改用 next/script strategy="beforeInteractive" —— 静态导出下它只会
// 被序列进 RSC 的 __next_s，由客户端 bootstrap 在 hydration 前注入；当预览面板
// 把 chunk 内联进 srcdoc 时，bootstrap 先于 body 的 __next_s.push 执行，补丁永远
// 不会注入。只有物理地写进 <head> 的同步行内脚本才可靠。
const SrcDocCompatScript = readFileSync(
  join(process.cwd(), "scripts", "srcdoc-compat.js"),
  "utf8"
);

export const metadata: Metadata = {
  title: {
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  metadataBase: new URL(site.url),
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: site.url,
    title: site.title,
    description: site.description,
    siteName: site.name,
  },
  twitter: {
    card: "summary",
    title: site.title,
    description: site.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-bg text-fg antialiased`}>
        {/* 必须位于任何框架脚本之前执行：srcdoc 预览兼容补丁。
            构建后由 scripts/inject-srcdoc-compat.js 移到 <head> 顶部。 */}
        <script dangerouslySetInnerHTML={{ __html: SrcDocCompatScript }} />
        <ThemeProvider>
          <LocaleProvider>{children}</LocaleProvider>
        </ThemeProvider>

        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
