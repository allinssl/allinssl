import type { ThemeTemplate, PresetConfig } from '../../types'
import './style.css'

// 预设变量，用于继承预设主题
const presets: PresetConfig = {
	Modal: {
		preset: 'card',
	},
}

// 暗色主题
const goldDark: ThemeTemplate = {
	name: 'darkGold',
	type: 'dark',
	title: '暗金主题',
	themeOverrides: {},
	presetsOverrides: presets, // 预设变量
}

export { goldDark }
