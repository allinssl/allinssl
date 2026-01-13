import { type Ref, ref, watch, effectScope, onScopeDispose } from 'vue'
import type { NLocale, NDateLocale } from 'naive-ui'
import {
	enUS,
	dateEnUS,
	zhCN,
	dateZhCN,
	zhTW,
	dateZhTW,
	jaJP,
	dateJaJP,
	ruRU,
	dateRuRU,
	koKR,
	dateKoKR,
	ptBR,
	datePtBR,
	frFR,
	dateFrFR,
	esAR,
	dateEsAR,
	arDZ,
	dateArDZ,
} from 'naive-ui'

// 创建国际化列表
export const localeList: { type: string; name: string; locale: NLocale; dateLocale: NDateLocale }[] = [
	{
		type: 'zhCN',
		name: '简体中文',
		locale: zhCN,
		dateLocale: dateZhCN,
	},
	{
		type: 'zhTW',
		name: '繁體中文 ',
		locale: zhTW,
		dateLocale: dateZhTW,
	},
	{
		type: 'enUS',
		name: 'English',
		locale: enUS,
		dateLocale: dateEnUS,
	},
	{
		type: 'jaJP',
		name: '日本語',
		locale: jaJP,
		dateLocale: dateJaJP,
	},
	{
		type: 'ruRU',
		name: 'Русский',
		locale: ruRU,
		dateLocale: dateRuRU,
	},
	{
		type: 'koKR',
		name: '한국어',
		locale: koKR,
		dateLocale: dateKoKR,
	},
	{
		type: 'ptBR',
		name: 'Português',
		locale: ptBR,
		dateLocale: datePtBR,
	},
	{
		type: 'frFR',
		name: 'Français',
		locale: frFR,
		dateLocale: dateFrFR,
	},
	{
		type: 'esAR',
		name: 'Español',
		locale: esAR,
		dateLocale: dateEsAR,
	},
	{
		type: 'arDZ',
		name: 'العربية',
		locale: arDZ,
		dateLocale: dateArDZ,
	},
]

/**
 * 将下划线格式的语言代码转换为驼峰格式
 * @param locale - 语言代码，例如: 'zh_CN', 'en_US'
 * @returns 转换后的语言代码，例如: 'zhCN', 'enUS'
 */
const transformLocale = (locale: string): string => {
	return locale.replace(/_/g, '')
}

/**
 * 动态加载 Naive UI 的语言包
 * @param locale - 语言代码，例如: 'zh_CN', 'en_US'
 * @returns Promise<{locale: NLocale, dateLocale: NDateLocale} | null>
 */
const loadNaiveLocale = async (locale: string) => {
	try {
		const localeConfig = localeList.find((item) => item.type === transformLocale(locale))
		if (!localeConfig) {
			throw new Error(`Locale ${locale} not found`)
		}
		return localeConfig
	} catch (error) {
		// 加载失败时输出警告信息并返回 null
		console.warn(`Failed to load locale ${locale}:`, error)
		return null
	}
}

/**
 * 同步 Vue I18n 和 Naive UI 的语言设置
 * @returns {Object} 返回 Naive UI 的语言配置
 * @property {Ref<NLocale|null>} naiveLocale - Naive UI 组件的语言配置
 * @property {Ref<NDateLocale|null>} naiveDateLocale - Naive UI 日期组件的语言配置
 */
export function useNaiveI18nSync(locale: Ref<string>) {
	// 创建响应式的 Naive UI 语言配置
	const naiveLocale = ref<NLocale | null>(null)
	const naiveDateLocale = ref<NDateLocale | null>(null)
	const scope = effectScope()
	scope.run(() => {
		// 监听 Vue I18n 的语言变化
		watch(
			locale,
			async (newLocale) => {
				// 加载新语言的配置
				const localeConfig = await loadNaiveLocale(newLocale)
				// 如果加载成功，更新 Naive UI 的语言配置
				if (localeConfig) {
					naiveLocale.value = localeConfig.locale
					naiveDateLocale.value = localeConfig.dateLocale
				}
			},
			{ immediate: true }, // 立即执行一次，确保初始化时加载正确的语言
		)
	})
	// 在组件卸载时停止所有响应式效果
	onScopeDispose(() => {
		scope.stop()
	})
	return {
		naiveLocale,
		naiveDateLocale,
	}
}
