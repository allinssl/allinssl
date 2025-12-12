import tseslint from 'typescript-eslint'
import pluginVitest from '@vitest/eslint-plugin' // vitest 插件，用于解析 .test 和 .spec 文件
import pluginPlaywright from 'eslint-plugin-playwright' // playwright 插件，用于解析 playwright 测试

export default tseslint.config([
	// 配置 vitest 的 eslint 规则
	{
		...pluginVitest.configs.recommended,
		files: ['src/**/__tests__/*'],
	},
	// 配置 playwright 的 eslint 规则
	{
		...pluginPlaywright.configs['flat/recommended'],
		files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
	},
])
