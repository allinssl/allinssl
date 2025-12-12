import { type Ref, watch, effectScope, onScopeDispose, type WritableComputedRef, getCurrentScope } from 'vue'
import { createI18n, I18n, I18nOptions, useI18n } from 'vue-i18n'
import { useLocalStorage } from '@vueuse/core'
import translationList from './translation'

interface LocaleReturn {
	i18n: I18n
	locale: Ref<string>
	localeOptions: { label: string; value: string }[]
	$t: (key: string, params?: Record<string, any>) => string
}

/**
 * @description 国际化
 * @param i18nConfig 国际化配置
 * @param scanConfig 扫描配置
 * @returns {LocaleReturn} 国际化实例
 */
export const useLocale = (
	i18nConfig: I18nOptions & { fileExt?: string },
	scanFiles: Record<string, () => Promise<any>>,
): LocaleReturn => {
	// 当前激活的语言
	const locale = useLocalStorage<string>('locales-active', 'zhCN')

	const fileExt = i18nConfig?.fileExt || 'js'

	// 初始化语言包映射
	Object.keys(scanFiles).forEach((file) => {
		// 提取语言代码 (例如: './zh_CN/index.js' -> 'zh_CN')
		const langCode = file.match(/\.\/model\/([^/]+)\.js$/)?.[1] as string
		if (i18nConfig?.messages?.['zhCN'] || i18nConfig?.messages?.['enUS']) return
		if (langCode && Array.isArray(i18nConfig?.messages)) {
			i18nConfig.messages[langCode] = scanFiles[file] as any
		}
	})
	// 如果没有设置语言包，则使用默认语言包

	// 创建国际化实例
	const i18n = createI18n({
		legacy: false,
		locale: locale.value || 'zhCN', // 设置默认语言
		fallbackLocale: 'enUS',
		...i18nConfig,
	}) as I18n

	const language = (lang: string) => `./model/${lang}.${fileExt}`

	/**
	 * 加载语言包
	 * @param {string} lang - 语言代码
	 * @returns {Promise<Object>} - 语言包内容
	 */
	const loadLocaleMessages = async (lang: string) => {
		try {
			if (!scanFiles[language(lang)]) {
				console.warn(`Language ${lang} not found`)
				return {}
			}
			// 加载语言包
			const loadedModule = await scanFiles[language(lang)]?.()
			return loadedModule?.default || loadedModule || {}
		} catch (error) {
			console.error(`Failed to load locale ${lang}:`, error)
			return {}
		}
	}

	/**
	 * 获取可用的语言列表，生成对应的选项，需要过滤掉不支持的语言
	 * @returns {string[]} - 语言代码列表
	 */
	const localeOptions = Object.entries(translationList)
		.filter(([key]) => {
			return Object.keys(scanFiles).includes(language(key))
		})
		.map(([key, value]) => ({
			label: value,
			value: key,
		}))
		.sort((a, b) => {
			const order = ['zhCN', 'zhTW', 'enUS'] // 优先级最高
			// 获取当前语言在优先级数组中的索引
			const indexA = order.indexOf(a.value)
			const indexB = order.indexOf(b.value)
			// 如果都在优先级数组中，则按索引排序
			if (indexA !== -1 && indexB !== -1) {
				return indexA - indexB
			}
			// 否则按字母顺序排序
			return a.label.localeCompare(b.label)
		})

	const scope = effectScope()
	scope.run(() => {
		// 监听语言变化
		watch(
			locale,
			async (newVal) => {
				const messages = await loadLocaleMessages(newVal)
				// 设置语言包
				i18n.global.setLocaleMessage(newVal, messages)
				// 获取当前作用域
				const scope = getCurrentScope()

				if (scope) {
					// 使用当前作用域
					const { locale } = useI18n()
					// 设置当前语言
					locale.value = newVal
				} else {
					;(i18n.global.locale as WritableComputedRef<string, string>).value = newVal
				}
				// 设置当前语言
			},
			{ immediate: true },
		)
		onScopeDispose(() => {
			scope.stop()
		})
	})

	// 设置默认语言
	return {
		i18n,
		locale,
		$t: i18n.global.t,
		localeOptions,
	}
}
