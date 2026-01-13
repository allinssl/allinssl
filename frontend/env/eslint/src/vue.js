import pluginVue from 'eslint-plugin-vue' // vue 插件，用于解析 .vue 文件
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript' // vue ts 配置，用于解析 .ts 和 .tsx 文件
import oxlint from 'eslint-plugin-oxlint' // oxlint 插件，用于解析 oxlint 规则
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting' // prettier 配置，用于跳过格式化

// 配置 vue 的 eslint 规则
export default defineConfigWithVueTs(
	// 配置需要解析的文件
	{
		name: 'app/files-to-lint',
		files: ['**/*.{ts,mts,tsx,vue}'],
	},
	// 配置需要忽略的文件
	{
		name: 'app/files-to-ignore',
		ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
	},
	// 配置 vue 的 eslint 规则
	pluginVue.configs['flat/essential'],
	// 配置 vue ts 的 eslint 规则
	vueTsConfigs.recommended,
	// 配置 oxlint 的 eslint 规则
	...oxlint.configs['flat/recommended'],
	// 配置 prettier 的 eslint 规则
	skipFormatting,
	// 修复 TypeScript-ESLint 的 no-unused-expressions 规则问题
	{
		rules: {
			'@typescript-eslint/no-unused-expressions': ['error', {
				allowShortCircuit: true,
				allowTernary: true,
				allowTaggedTemplates: true,
			}],
		},
	},
)
