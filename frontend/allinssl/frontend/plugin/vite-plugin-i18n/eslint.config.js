import vueConfig from '@baota/eslint/vue'
import baseConfig from '@baota/eslint'

/** @type {import("eslint").Linter.Config[]} */
const config = [
	// Vue 相关配置，包含 TypeScript 支持
	...vueConfig,

	// 基础配置，用于通用的 JavaScript/TypeScript 规则
	...baseConfig,

	// 项目特定的配置覆盖
	{
		files: ['**/*.{js,ts,tsx,jsx,vue}'],
		rules: {
			// 在此处添加项目特定的规则覆盖
			'vue/multi-word-component-names': 'off', // 关闭组件名称必须由多个单词组成的规则
		},
	},
]

export default config
