"use client";

import { usePathname } from "next/navigation";

/**
 * 站内链接一律使用「相对当前文档」的路径。绝对根路径 /blog 在预览面板的
 * 带前缀 URL、file:// 打开、以及子目录部署时都会解析到错误位置。
 *
 * 返回从当前页面回到站点根的相对前缀：
 *   顶层页面 /blog、/about、/<prefix>/blog       → "./"
 *   文章页   /blog/<slug>、/<prefix>/blog/<slug>  → "../"
 *
 * 判断依据是 pathname 中 "blog" 段之后是否还有路径段，不依赖部署前缀的
 * 具体内容，因此 SSR 与客户端 hydration 的结论一致。
 *
 * 注意：使用这些相对路径的链接必须用原生 a 标签，不能用 next/link ——
 * 客户端路由会把相对 href 重新解析成基于 router base 的绝对路径。
 */
/**
 * 当前是否为博客文章详情页（/blog/<slug>）。
 * 顶部返回按钮据此在「回首页」与「回列表」之间切换。
 */
export function useIsPostPage(): boolean {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);
  const blogIndex = segments.indexOf("blog");
  return blogIndex >= 0 && segments.length > blogIndex + 1;
}

export function useSitePrefix(): string {
  return useIsPostPage() ? "../" : "./";
}
