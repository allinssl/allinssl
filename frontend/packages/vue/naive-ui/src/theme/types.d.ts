import type { GlobalThemeOverrides, ModalProps, FormProps, FormItemProps, TableProps } from 'naive-ui'

export interface ThemeTemplate {
	name: string
	type: 'light' | 'dark'
	title: string
	themeOverrides: GlobalThemeOverrides
	presetsOverrides: PresetConfig
}

export interface ThemeTemplateType {
	[key: string]: ThemeTemplate
}

// 主题名称
export type ThemeName = string

// 预设配置
export interface PresetConfig {
	Modal?: ModalProps
	Form?: FormProps
	FormItem?: FormItemProps
	Table?: TableProps
}

export interface ThemeItemProps {
	name: string // 主题标识
	type: 'light' | 'dark' // 主题类型，可选值为 light、dark，用于继承预设主题
	title: string // 主题名称
	import: () => Promise<ThemeTemplate> // 主题导入函数，用于动态导入主题文件
	styleContent: () => Promise<string> // 主题样式内容，用于动态生成主题样式
}

export interface ThemeJsonProps {
	[key: string]: ThemeItemProps // 主题表，key为主题标识，value为主题配置
}
