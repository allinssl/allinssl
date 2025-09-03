import js from '@eslint/js'
import prettierRules from 'eslint-config-prettier'
import turboPlugin from 'eslint-plugin-turbo'
import tseslint from 'typescript-eslint'
import onlyWarn from 'eslint-plugin-only-warn'

// eslint 配置
export default tseslint.config([
	// 配置需要忽略的文件
	{
		ignores: ['node_modules', 'dist'],
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
			'turbo/no-undeclared-env-vars': 'warn',
		},
	},
	// 配置 only-warn 的 eslint 规则
	{
		plugins: {
			onlyWarn,
		},
	},
])
