import baseConfig from '@baota/eslint'

/** @type {import("eslint").Linter.Config[]} */
const config = [
	// 基础配置，用于通用的 JavaScript/TypeScript 规则
	...baseConfig,
	// 项目特定的配置覆盖
	{
		files: ['**/*.{js,ts}'],
		rules: {
			// 在此处添加项目特定的规则覆盖
		},
	},
]

export default config
