// 自动生成的i18n入口文件
// 自动生成的i18n入口文件
import { useLocale } from '@baota/i18n'
import zhCN from './model/zhCN.json'
import enUS from './model/enUS.json'

// 使用 i18n 插件
export const { i18n, $t, locale, localeOptions } = useLocale(
	{
		messages: { zhCN, enUS },
		locale: 'zhCN',
		fileExt: 'json'
	},
	import.meta.glob([`./model/*.json`], {
		eager: false,
	}),
)

