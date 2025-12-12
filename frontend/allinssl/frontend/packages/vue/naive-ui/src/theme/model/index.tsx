// 导出主题表，需要自己定义

import type { ThemeJsonProps } from '../types'

const cssModules = import.meta.glob('../model/*/*.css', {
	eager: false,
	import: 'default',
	// as: 'url', // 使用 url 加载器,将 CSS 文件作为独立的资源加载
})

const themes: ThemeJsonProps = {
	defaultLight: {
		name: 'defaultLight', // 主题标识
		type: 'light', // 主题类型，可选值为 light、dark，用于继承预设主题
		title: '默认亮色主题', // 主题名称
		import: async () => (await import('./default/index')).defaultLight, // 主题导入函数，用于动态导入主题文件
		styleContent: async () => (await cssModules['./default/style.css']()) as string, // 主题样式导入函数，用于动态导入主题样式文件
	},
	defaultDark: {
		name: 'defaultDark',
		type: 'dark',
		title: '默认暗色主题',
		import: async () => (await import('./default/index')).defaultDark,
		styleContent: async () => (await cssModules['./default/style.css']()) as string, // 主题样式导入函数，用于动态导入主题样式文件
	},
	// baotaLight: {
	// 	name: 'baotaLight',
	// 	type: 'light',
	// 	title: '宝塔主题',
	// 	import: async () => (await import('./baota/index')).baotaLight,
	// 	styleContent: async () => (await cssModules['./baota/style.css']()) as string, // 主题样式导入函数，用于动态导入主题样式文件
	// },
	// darkGold: {
	// 	name: 'darkGold',
	// 	type: 'dark',
	// 	title: '暗金主题',
	// 	import: async () => (await import('./dark-gold/index')).goldDark,
	// 	styleContent: async () => (await cssModules['./dark-gold/style.css']()) as string, // 主题样式导入函数，用于动态导入主题样式文件
	// },
}

export default themes
