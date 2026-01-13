import { defineComponent } from 'vue'
import { NSwitch, NTooltip } from 'naive-ui'
import { useTheme } from '../theme/index'

/**
 * @description 暗黑模式切换组件
 */
export const DarkModeSwitch = defineComponent({
	name: 'DarkModeSwitch',
	setup() {
		const { isDark, cutDarkMode } = useTheme()
		return () => (
			<div>
				<NTooltip trigger="hover">
					{{
						trigger: () => (
							<NSwitch
								value={isDark.value}
								onUpdateValue={() => cutDarkMode()}
								rail-style={() => ({
									background: isDark.value ? '#333' : '#eee',
									transition: 'background .3s',
								})}
							>
								{{
									checked: () => '🌙',
									unchecked: () => '☀️',
								}}
							</NSwitch>
						),
						default: () => (isDark.value ? '切换到亮色模式' : '切换到暗色模式'),
					}}
				</NTooltip>
			</div>
		)
	},
})

export default DarkModeSwitch
