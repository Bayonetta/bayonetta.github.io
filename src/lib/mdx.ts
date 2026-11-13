import rehypePrettyCode from 'rehype-pretty-code';
import remarkGfm from 'remark-gfm';

// MDX 渲染配置：使用 rehype-pretty-code + Shiki 做语法高亮
// 显式标注为 any，避免 TS 对插件类型过于严格从而阻塞构建
export const mdxOptions: any = {
  mdxOptions: {
    // remark-gfm 提供表格、删除线、自动链接等 GFM 扩展；
    // 缺了它，文章里的 Markdown 表格会整段以竖线原文显示
    remarkPlugins: [remarkGfm],
    rehypePlugins: [
      [
        rehypePrettyCode,
        {
          theme: 'github-dark-dimmed', // Shiki 主题，可选 tokyo-night, one-dark-pro 等
          keepBackground: false, // 使用我们自己的背景色，避免冲突
        },
      ],
    ],
  },
};

