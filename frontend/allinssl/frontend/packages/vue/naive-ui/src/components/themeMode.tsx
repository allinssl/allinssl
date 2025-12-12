import { defineComponent } from 'vue'
import { NSpace, NText } from 'naive-ui'
import DarkModeSwitch from './darkModeSwitch'

/**
 * @description 主题模式切换组件
 */
export const ThemeMode = defineComponent({
	name: 'ThemeMode',
	setup() {
		return () => (
			<NSpace align="center">
				<NText>模式：</NText>
				<DarkModeSwitch />
			</NSpace>
		)
	},
})

export default ThemeMode
