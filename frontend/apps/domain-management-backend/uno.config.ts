import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
	presets: [
		presetUno(),
		presetAttributify(),
		// presetIcons({
		//   scale: 1.2,
		//   warn: true,
		//   collections: {
		//     carbon: () =>
		//       import("@iconify-json/carbon/icons.json").then((i) => i.default),
		//   },
		//   extraProperties: {
		//     display: "inline-block",
		//     "vertical-align": "middle",
		//   },
		// }),
	],
	shortcuts: {
		// 基础按钮样式
		'btn-base':
			'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
		'btn-primary': 'btn-base bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
		'btn-secondary': 'btn-base bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
		'btn-outline': 'btn-base border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500',
		'btn-ghost': 'btn-base hover:bg-gray-100 focus-visible:ring-gray-500',
		// 尺寸变体
		'btn-sm': 'h-8 px-3 text-xs',
		'btn-md': 'h-9 px-4 py-2',
		'btn-lg': 'h-10 px-8',
		// 输入框样式
		'input-base':
			'flex h-9 w-full rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50',
		// 卡片样式
		card: 'rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm',
		'card-header': 'flex flex-col space-y-1.5 p-6',
		'card-content': 'p-6 pt-0',
		'card-footer': 'flex items-center p-6 pt-0',
		// 卡片阴影效果
		'card-shadow': 'rounded-lg shadow-sm transition-all duration-300 ease-in-out',
		'card-shadow-hover': 'hover:shadow-lg hover:-translate-y-1',
	},
	theme: {
		colors: {
			// Naive UI 兼容的主色调系统
			primary: {
				50: '#eff6ff',
				100: '#dbeafe',
				200: '#bfdbfe',
				300: '#93c5fd',
				400: '#60a5fa',
				500: '#3b82f6',
				600: '#2563eb',
				700: '#1d4ed8',
				800: '#1e40af',
				900: '#1e3a8a',
				950: '#172554',
			},
			// 语义化颜色
			success: {
				50: '#f0fdf4',
				100: '#dcfce7',
				200: '#bbf7d0',
				300: '#86efac',
				400: '#4ade80',
				500: '#22c55e',
				600: '#16a34a',
				700: '#15803d',
				800: '#166534',
				900: '#14532d',
				950: '#052e16',
			},
			warning: {
				50: '#fffbeb',
				100: '#fef3c7',
				200: '#fde68a',
				300: '#fcd34d',
				400: '#fbbf24',
				500: '#f59e0b',
				600: '#d97706',
				700: '#b45309',
				800: '#92400e',
				900: '#78350f',
				950: '#451a03',
			},
			error: {
				50: '#fef2f2',
				100: '#fee2e2',
				200: '#fecaca',
				300: '#fca5a5',
				400: '#f87171',
				500: '#ef4444',
				600: '#dc2626',
				700: '#b91c1c',
				800: '#991b1b',
				900: '#7f1d1d',
				950: '#450a0a',
			},
			info: {
				50: '#f0f9ff',
				100: '#e0f2fe',
				200: '#bae6fd',
				300: '#7dd3fc',
				400: '#38bdf8',
				500: '#0ea5e9',
				600: '#0284c7',
				700: '#0369a1',
				800: '#075985',
				900: '#0c4a6e',
				950: '#082f49',
			},
			// 灰度色阶
			gray: {
				50: '#f9fafb',
				100: '#f3f4f6',
				200: '#e5e7eb',
				300: '#d1d5db',
				400: '#9ca3af',
				500: '#6b7280',
				600: '#4b5563',
				700: '#374151',
				800: '#1f2937',
				900: '#111827',
				950: '#030712',
			},
		},
		fontFamily: {
			// Naive UI 推荐的字体栈
			sans: [
				'-apple-system',
				'BlinkMacSystemFont',
				'Segoe UI',
				'Roboto',
				'Oxygen',
				'Ubuntu',
				'Cantarell',
				'Fira Sans',
				'Droid Sans',
				'Helvetica Neue',
				'sans-serif',
			],
			mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
		},
		fontSize: {
			// Naive UI 兼容的字体大小
			xs: ['0.75rem', { 'line-height': '1rem' }],
			sm: ['0.875rem', { 'line-height': '1.25rem' }],
			base: ['1rem', { 'line-height': '1.5rem' }],
			lg: ['1.125rem', { 'line-height': '1.75rem' }],
			xl: ['1.25rem', { 'line-height': '1.75rem' }],
			'2xl': ['1.5rem', { 'line-height': '2rem' }],
			'3xl': ['1.875rem', { 'line-height': '2.25rem' }],
			'4xl': ['2.25rem', { 'line-height': '2.5rem' }],
			'5xl': ['3rem', { 'line-height': '1' }],
			'6xl': ['3.75rem', { 'line-height': '1' }],
		},
		spacing: {
			// Naive UI 兼容的间距系统
			'0': '0px',
			'1': '0.25rem',
			'2': '0.5rem',
			'3': '0.75rem',
			'4': '1rem',
			'5': '1.25rem',
			'6': '1.5rem',
			'8': '2rem',
			'10': '2.5rem',
			'12': '3rem',
			'16': '4rem',
			'20': '5rem',
			'24': '6rem',
			'32': '8rem',
			'40': '10rem',
			'48': '12rem',
			'56': '14rem',
			'64': '16rem',
		},
		borderRadius: {
			none: '0',
			sm: '0.125rem',
			DEFAULT: '0.25rem',
			md: '0.375rem',
			lg: '0.5rem',
			xl: '0.75rem',
			'2xl': '1rem',
			'3xl': '1.5rem',
			full: '9999px',
		},
		boxShadow: {
			// Naive UI 兼容的阴影系统
			sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
			DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
			md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
			lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
			xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
			'2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
			inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
			none: 'none',
		},
	},
	content: {
		pipeline: {
			include: [
				// 默认包含的文件
				/\.(vue|svelte|[jt]sx?|mdx?|astro|elm|php|phtml|html)($|\?)/,
				// 包含 js/ts 文件
				'src/**/*.{js,ts,tsx,css}',
			],
		},
	},
})
