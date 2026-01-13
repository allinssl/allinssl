import { computed, defineComponent, PropType } from 'vue'
import { NDropdown, NIcon, NButton } from 'naive-ui'
import { Sunny, Moon } from '@vicons/ionicons5'

import { useTheme } from '../theme/index'
import type { DropdownOption } from 'naive-ui'
interface Props {
	type?: 'button' | 'link'
	size?: 'small' | 'medium' | 'large'
	text?: boolean
}

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'button' | 'link'>,
			default: 'button',
		},
		size: {
			type: String as PropType<'small' | 'medium' | 'large'>,
			default: 'medium',
		},
		text: {
			type: Boolean,
			default: false,
		},
	},
	setup(props: Props) {
		const { isDark, cutDarkMode, themeActive } = useTheme()

		const dropdownOptions: DropdownOption[] = [
			{
				label: '亮色模式',
				key: 'defaultLight',
			},
			{
				label: '暗色模式',
				key: 'defaultDark',
			},
		]

		const iconSize = computed(() => {
			return props.size === 'small' ? 16 : props.size === 'large' ? 24 : 20
		})

		const buttonSize = computed(() => {
			return props.size === 'small' ? 'tiny' : props.size === 'large' ? 'large' : 'medium'
		})

		const text = computed(() => {
			return !isDark.value ? '亮色模式' : '暗色模式'
		})

		return () => (
			<NDropdown options={dropdownOptions} onSelect={() => cutDarkMode(true, this)} value={themeActive.value}>
				<div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
					{props.type === 'button' ? (
						<NButton quaternary strong circle type="primary" size={buttonSize.value}>
							<NIcon size={iconSize.value}>{isDark.value ? <Moon /> : <Sunny />}</NIcon>
						</NButton>
					) : (
						<NIcon size={iconSize.value}>{isDark.value ? <Moon /> : <Sunny />}</NIcon>
					)}
					<span class="ml-[0.6rem]">{props.text && text.value}</span>
				</div>
			</NDropdown>
		)
	},
})
