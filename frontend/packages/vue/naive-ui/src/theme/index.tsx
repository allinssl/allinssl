import { computed, ref, effectScope, onScopeDispose, watch } from 'vue'
import { useDark, useLocalStorage } from '@vueuse/core'
import { darkTheme, lightTheme, useThemeVars } from 'naive-ui'
import themes from './model'

import type { ThemeName, ThemeItemProps, ThemeTemplate } from './types'

// 驼峰命名转中划线命名的缓存
const camelToKebabCache = new Map<string, string>()

/**
 * @description 驼峰命名转中划线命名
 * @param {string} str 输入的驼峰字符串
 * @returns {string} 转换后的中划线字符串
 */
const camelToKebabCase = (str: string): string => {
	if (camelToKebabCache.has(str)) {
		return camelToKebabCache.get(str)!
	}
	// 修改正则表达式，支持在字母与数字之间添加中划线
	const result = str
		.replace(/([a-z])([A-Z0-9])/g, '$1-$2')
		.replace(/([0-9])([a-zA-Z])/g, '$1-$2')
		.toLowerCase()
	camelToKebabCache.set(str, result)
	return result
}

/**
 * @description 主题组合函数
 * @param {ThemeName} name 初始主题名称
 * @returns 主题状态和方法
 */
export const useTheme = (name?: ThemeName) => {
	// 主题状态
	const themeActive = useLocalStorage<ThemeName>('theme-active', name || 'defaultLight') // 主题名称

	// 主题激活状态 Ref
	const themeActiveOverrides = ref<ThemeTemplate | null>(null)

	// 是否暗黑
	
	// const isDark = useDark()

	// 禁用自动切换暗色模式避免错误
	const isDark = ref(false)

	// 主题
	const theme = computed(() => {
		return isDark.value ? darkTheme : lightTheme
	})

	// 主题继承修改
	const themeOverrides = computed(() => {
		// 如果没有激活的主题，则返回空对象
		if (!themeActiveOverrides.value) return {}
		return themeActiveOverrides.value.themeOverrides || {}
	})

	// 预设配置
	const presetsOverrides = computed(() => {
		// 如果没有激活的主题，则返回空对象
		console.log('presetsOverrides', themeActiveOverrides.value)
		if (!themeActiveOverrides.value) return {}
		return themeActiveOverrides.value.presetsOverrides || {}
	})

	/**
	 * @description 切换暗黑模式
	 * @param {boolean} hasAnimation 是否有动画
	 */
	const cutDarkMode = (hasAnimation: boolean = false, e?: MouseEvent) => {
		// 检查当前主题是否存在暗黑模式
		isDark.value = !isDark.value

		if (hasAnimation) {
			// 如果有动画，则执行切换暗黑模式动画
			cutDarkModeAnimation(e ? { clientX: e.clientX, clientY: e.clientY } : undefined)
		} else {
			themeActive.value = isDark.value ? 'defaultDark' : 'defaultLight'
		}
		// 更新主题名称
	}

	/**
	 * @description 切换暗色模式动画
	 */
	const cutDarkModeAnimation = (event?: { clientY: number; clientX: number }) => {
		const root = document.documentElement
		// 先移除现有动画类
		root.classList.remove('animate-to-light', 'animate-to-dark')

		// 添加相应的动画类
		root.classList.add(isDark.value ? 'animate-to-light' : 'animate-to-dark')

		// 切换主题
		themeActive.value = isDark.value ? 'defaultDark' : 'defaultLight'
		setTimeout(() => {
			// 先移除现有动画类
			root.classList.remove('animate-to-light', 'animate-to-dark')
		}, 500)
	}

	/**
	 * @description 动态加载CSS内容
	 * @param {string} cssContent CSS内容
	 * @param {string} id 样式标签ID
	 */
	const loadDynamicCss = (cssContent: string, id: string) => {
		// 检查是否已存在相同ID的样式标签
		let styleElement = document.getElementById(id) as HTMLStyleElement

		if (!styleElement) {
			// 如果不存在，创建新的style标签
			styleElement = document.createElement('style')
			styleElement.id = id
			document.head.appendChild(styleElement)
		}

		// 更新样式内容
		styleElement.textContent = cssContent
	}

	/**
	 * @description 加载主题样式
	 * @param {string} themeName 主题名称
	 */
	const loadThemeStyles = async (themeName: string) => {
		// 根据主题名称加载对应的样式文件
		try {
			// 从主题配置中获取样式路径
			const themeItem = themes[themeName]
			if (!themeItem) return
			// 加载主题样式
			const themeConfig = await themeItem.import()
			const themeStyles = await themeItem.styleContent() // 获取主题样式内容
			// 加载新样式
			if (themeStyles || themeStyles) {
				loadDynamicCss(themeStyles as string, 'theme-style')
			}
			// 更新激活的主题
			themeActiveOverrides.value = themeConfig
		} catch (error) {
			console.error(`加载主题失败 ${themeName}:`, error)
		}
	}

	/**
	 * @description 获取主题列表
	 * @returns {ThemeItemProps[]} 主题列表
	 */
	const getThemeList = () => {
		const themeList: ThemeItemProps[] = []
		for (const key in themes) {
			themeList.push(themes[key])
		}
		return themeList
	}

	const scope = effectScope()
	scope.run(() => {
		watch(
			themeActive,
			(newVal) => {
				// 移除之前的主题类名
				if (themeActive.value) document.documentElement.classList.remove(themeActive.value)
				// 添加新的主题类名
				document.documentElement.classList.add(newVal)
				// 更新主题名称
				themeActive.value = newVal
				// 加载主题样式
				loadThemeStyles(newVal)
			},
			{ immediate: true },
		)
		onScopeDispose(() => {
			scope.stop()
		})
	})

	return {
		// 状态
		theme,
		themeOverrides,
		presetsOverrides,
		isDark,
		themeActive,
		// 方法
		getThemeList, // 获取主题列表
		cutDarkModeAnimation, // 切换暗黑模式动画
		cutDarkMode, // 切换暗黑模式
		loadThemeStyles, // 加载主题样式
		loadDynamicCss, // 动态加载CSS内容
	}
}

/**
 * @description 主题样式提取
 * @param {string[]} options 主题变量
 * @param options
 */
/**
 * @description 主题样式提取
 * @param {string[]} options 主题变量
 * @returns {string} 生成的样式字符串
 */
export const useThemeCssVar = (options: string[]) => {
	const vars = useThemeVars()
	const stylesRef = ref('')
	const scope = effectScope()
	scope.run(() => {
		watch(
			vars,
			(newVal) => {
				// 使用数组收集样式，最后统一拼接
				const styles: string[] = []
				for (const key of options) {
					if (key in newVal) {
						const kebabKey = camelToKebabCase(key)
						styles.push(`--n-${kebabKey}: ${newVal[key as keyof typeof vars.value]};`)
					}
				}
				// 拼接样式字符串
				stylesRef.value = styles.join('\n')
			},
			{ immediate: true },
		)
		onScopeDispose(() => {
			scope.stop()
		})
	})
	return stylesRef
}
