import rehypePrettyCode from 'rehype-pretty-code';

// MDX 渲染配置：使用 rehype-pretty-code + Shiki 做语法高亮
// 显式标注为 any，避免 TS 对插件类型过于严格从而阻塞构建
export const mdxOptions: any = {
  mdxOptions: {
    remarkPlugins: [],
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

