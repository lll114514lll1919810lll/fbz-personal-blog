import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".preview/**",
    // wrangler pages dev 的临时打包产物。它在 .gitignore 里，但 eslint
    // 不读 .gitignore——本地跑过一次评论调试，lint 就会被这些生成文件
    // 里的 warning 污染（CI 上不会复现，属于「本地吵、线上不吵」的假信号）。
    ".wrangler/**",
    // UI 审计脚本是一次性诊断工具，用 CommonJS 跑在 Node 里，
    // 不属于应用代码，不适用 React/TS 规范
    "scripts/**/*.cjs",
  ]),
]);

export default eslintConfig;
