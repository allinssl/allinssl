import type { ThemeTemplate, PresetConfig } from '../../types'
import './style.css'

// 预设变量，用于继承预设主题
const presets: PresetConfig = {
	Modal: {
		preset: 'card',
	},
}

// 默认亮色主题
const blueLight: ThemeTemplate = {
	name: 'blueLight', // 主题标识
	type: 'light', // 主题类型，可选值为 light、dark，用于继承预设主题
	title: '蓝色主题', // 主题名称
	themeOverrides: {
		common: {},
	}, // 主题变量
	presetsOverrides: presets, // 预设变量
}

// 默认暗色主题
const blueDark: ThemeTemplate = {
	name: 'blueDark',
	type: 'dark',
	title: '蓝色主题',
	themeOverrides: {
		common: {
			// baseColor: '#F1F1F1', // 基础色
			primaryColor: '#4caf50', // 主色
			primaryColorHover: '#20a53a', // 主色悬停
			primaryColorPressed: '#157f3a', // 主色按下
			primaryColorSuppl: '#4caf50', // 主色补充
		},

		Popover: {
			// color: '#ffffff', // 弹出层背景色
		},
		Button: {
			textColorPrimary: '#ffffff', // 主按钮文本色
			textColorHoverPrimary: '#ffffff', // 主按钮文本色悬停
			textColorPressedPrimary: '#ffffff', // 主按钮文本色按下
			textColorFocusPrimary: '#ffffff', // 主按钮文本色聚焦
		},
		Radio: {
			buttonTextColorActive: '#ffffff', // 单选框文本色
		},
	},
	presetsOverrides: presets, // 预设变量
}

export { blueLight, blueDark }
