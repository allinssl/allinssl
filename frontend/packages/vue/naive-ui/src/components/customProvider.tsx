import { defineComponent, watch } from 'vue'
import {
	NConfigProvider,
	NDialogProvider,
	NMessageProvider,
	NModalProvider,
	NNotificationProvider,
	zhCN,
	dateZhCN,
} from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useTheme } from '../theme'
import { useNaiveI18nSync } from '../i18n'

// 全局配置组件
export default defineComponent({
	name: 'NCustomProvider',
	setup(_, { slots }) {
		const { locale } = useI18n() // 国际化
		const { naiveLocale, naiveDateLocale } = useNaiveI18nSync(locale) // i18n 同步
		const { theme, themeOverrides } = useTheme() // 主题

		console.log(theme.value, themeOverrides.value)

		watch(
			() => themeOverrides.value,
			(newVal) => {
				console.log('1111', newVal)
			},
		)

		// 国际化配置
		return () => (
			<NConfigProvider
				theme={theme.value}
				theme-overrides={themeOverrides.value}
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

// 主题配置组件
const themeProvider = defineComponent({
	name: 'NThemeProvider',
	setup(_, { slots }) {
		const { theme, themeOverrides } = useTheme() // 主题
		return () => (
			<NConfigProvider theme={theme.value} theme-overrides={themeOverrides.value}>
				{slots.default?.()}
			</NConfigProvider>
		)
	},
})

export { themeProvider }
