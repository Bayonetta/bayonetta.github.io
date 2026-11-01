// ESLint 扁平配置。
// 注意：本项目装的是 eslint 8.57 + eslint-config-next 14.1.0，
// 而 eslint-config-next 14 只提供 eslintrc 格式的配置（没有 flat 数组导出，
// 也没有 typescript 子路径），因此必须用 FlatCompat 转换；
// 不能直接 `import nextVitals from "eslint-config-next/core-web-vitals"`。
import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
});

export default [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "next-env.d.ts",
      // 预览产物（单文件自包含 HTML 与脚本，非源码）
      "scripts/**",
    ],
  },
];
