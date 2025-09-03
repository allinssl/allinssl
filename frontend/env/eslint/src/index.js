import js from "@eslint/js";
import prettierRules from "eslint-config-prettier"; // eslint插件 prettier
import turboPlugin from "eslint-plugin-turbo"; // eslint插件 turbo
import tseslint from "typescript-eslint"; // eslint插件 类型检查
import onlyWarn from "eslint-plugin-only-warn"; // eslint插件 只警告

// 配置 eslint 规则
export default tseslint.config([
  // 配置需要忽略的文件
  {
    ignores: ["node_modules", "dist"],
  },
  // 配置 eslint 规则
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // 配置 prettier 的 eslint 规则
  prettierRules,
  // 配置 turbo 的 eslint 规则
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
    },
  },
  // 配置 only-warn 的 eslint 规则
  {
    plugins: {
      onlyWarn,
    },
  },
  // 修复 TypeScript-ESLint 的 no-unused-expressions 规则问题
  {
    rules: {
      "@typescript-eslint/no-unused-expressions": [
        "error",
        {
          allowShortCircuit: true,
          allowTernary: true,
          allowTaggedTemplates: true,
        },
      ],
    },
  },
]);
