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
    // UI 审计脚本是一次性诊断工具，用 CommonJS 跑在 Node 里，
    // 不属于应用代码，不适用 React/TS 规范
    "scripts/**/*.cjs",
  ]),
]);

export default eslintConfig;
