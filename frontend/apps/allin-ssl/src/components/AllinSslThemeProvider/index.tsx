import { computed, defineComponent } from 'vue'
import { NConfigProvider, NDialogProvider, NMessageProvider, NModalProvider, NNotificationProvider, zhCN, dateZhCN } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@baota/naive-ui/theme'
import { useNaiveI18nSync } from '@baota/naive-ui/i18n'
import { allinSslDarkThemeOverrides, allinSslLightThemeOverrides } from '@config/theme'

/**
 * AllinSSL 自定义主题提供者
 * 在 CustomProvider 基础上添加项目特定的主题覆盖
 */
export default defineComponent({
	name: 'AllinSslThemeProvider',
	setup(_, { slots }) {
		const { locale } = useI18n()
		const { naiveLocale, naiveDateLocale } = useNaiveI18nSync(locale)
		const { theme, themeOverrides, isDark } = useTheme()

		// 合并主题配置：base theme + 项目特定主题
		const mergedThemeOverrides = computed(() => {
			const baseOverrides = themeOverrides.value || {}
			const projectOverrides = isDark.value ? allinSslDarkThemeOverrides : allinSslLightThemeOverrides

			// 深度合并配置
			return {
				...baseOverrides,
				...projectOverrides,
				// 特殊处理 common，因为它包含多个属性
				common: {
					...baseOverrides.common,
					...projectOverrides.common,
				},
				Card: {
					...baseOverrides.Card,
					...projectOverrides.Card,
				},
				Layout: {
					...baseOverrides.Layout,
					...projectOverrides.Layout,
				},
				Button: {
					...baseOverrides.Button,
					...projectOverrides.Button,
				},
			}
		})

		return () => (
			<NConfigProvider
				theme={theme.value}
				theme-overrides={mergedThemeOverrides.value}
				locale={naiveLocale.value || zhCN}
				date-locale={naiveDateLocale.value || dateZhCN}
			>
				<NDialogProvider>
					<NMessageProvider>
						<NNotificationProvider>
							<NModalProvider>{slots.default?.()}</NModalProvider>
						</NNotificationProvider>
					</NMessageProvider>
				</NDialogProvider>
			</NConfigProvider>
		)
	},
})
