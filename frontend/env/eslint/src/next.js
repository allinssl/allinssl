import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { rules as prettierRules } from 'eslint-config-prettier'
import * as pluginReactHooks from 'eslint-plugin-react-hooks'
import * as pluginReact from 'eslint-plugin-react'
import * as pluginNext from '@next/eslint-plugin-next'

import baseConfig from './index.js'

// 配置 next.js 的 eslint 规则
const nextConfig = tseslint.config([
	...baseConfig,
	js.configs.recommended,
	prettierRules,
	...tseslint.configs.recommended,
	{
		...pluginReact.configs.flat.recommended,
		languageOptions: {
			...pluginReact.configs.flat.recommended.languageOptions,
			globals: {
				...globals.serviceworker,
			},
		},
	},
	{
		plugins: {
			'@next/next': pluginNext,
		},
		rules: {
			...pluginNext.configs.recommended.rules,
			...pluginNext.configs['core-web-vitals'].rules,
		},
	},
	{
		plugins: {
			'react-hooks': pluginReactHooks,
		},
		settings: { react: { version: 'detect' } },
		rules: {
			...pluginReactHooks.configs.recommended.rules,
			// React scope no longer necessary with new JSX transform.
			'react/react-in-jsx-scope': 'off',
		},
	},
])

export default nextConfig
