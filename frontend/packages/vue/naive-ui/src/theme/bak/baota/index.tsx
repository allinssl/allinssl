import type { ThemeTemplate, PresetConfig } from '../../types'
import './style.css'

// 预设参数配置，用于预设视图组件的相关参数
const presets: PresetConfig = {
	Modal: {
		preset: 'card',
	},
}

// 宝塔亮色主题
const baotaLight: ThemeTemplate = {
	name: 'baotaLight',
	type: 'light',
	title: '宝塔亮色主题',
	themeOverrides: {
		Layout: {
			color: '#f9fafb',
		},
		common: {
			primaryColor: '#20a53a',
			fontSize: '12px',
			fontWeight: '400',
		},
		Dialog: {
			titleTextColor: '#333',
			titleFontSize: '14px',
			titleFontWeight: '400',
			titlePadding: '12px 16px',
			iconSize: '0px',
			padding: '0px',
			fontSize: '12px',
			closeMargin: '10px 12px',
			border: '1px solid #d9d9d9',
		},
		Card: {
			titleFontSizeMedium: '14px',
			titleFontWeightMedium: '400',
			titlePaddingMedium: '12px 16px',
			border: '1px solid #d9d9d9',
			padding: '0px',
			actionColor: '#20a53a',
		},

		Button: {
			fontSizeSmall: '12px',
			fontSizeMedium: '12px',
			paddingMedium: '8px 16px',
			heightMedium: '32px',
		},
		DataTable: {
			thPaddingMedium: '8px',
			fontSizeMedium: '12px',
			thFontWeight: '400',
		},
		Table: {
			thPaddingMedium: '8px',
			fontSizeMedium: '12px',
			thFontWeight: '400',
		},
		Tabs: {
			navBgColor: '#fff',
			navActiveBgColor: '#eaf8ed',
			barColor: '#20a53a',
			tabFontWeightActive: '400',
		},
	},
	presetsOverrides: presets,
}

export { baotaLight }
