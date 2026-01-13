import { defineComponent } from 'vue'
import { NSelect, NSpace, NText } from 'naive-ui'
import { useTheme } from '../theme/index'
import DarkModeSwitch from './darkModeSwitch'

/**
 * @description 主题管理组件
 */
export const ThemeManage = defineComponent({
	name: 'ThemeManage',
	setup() {
		const { themeActive, getThemeList, setTheme } = useTheme()

		// 获取主题列表
		const themeList = getThemeList()

		// 主题选项
		const themeOptions = themeList.map((item) => ({
			label: item.title,
			value: item.name,
		}))

		return () => (
			<NSpace>
				<NText>主题：</NText>
				<NSelect
					style={{ width: '200px' }}
					value={themeActive.value}
					options={themeOptions}
					onUpdateValue={(value: string) => setTheme(value)}
				/>
				<DarkModeSwitch />
			</NSpace>
		)
	},
})

export default ThemeManage
