import { defineComponent, PropType } from 'vue'
import { NDropdown, NIcon, NButton } from 'naive-ui'
import { Language } from '@vicons/ionicons5'
import { useLocalStorage } from '@vueuse/core'
import { localeList } from '../i18n'

import type { DropdownOption } from 'naive-ui'

interface Props {
	type?: 'button' | 'link'
}

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'button' | 'link'>,
			default: 'button',
		},
	},
	setup(props: Props) {
		const locale = useLocalStorage('locales-active', 'zhCN')
		const dropdownOptions: DropdownOption[] = localeList.map((item) => ({
			label: item.name,
			key: item.type,
		}))
		return () => (
			<NDropdown options={dropdownOptions} onSelect={(key: string) => (locale.value = key)} value={locale.value}>
				<div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
					{props.type === 'button' ? (
						<NButton quaternary strong circle type="primary">
							<NIcon size={20}>
								<Language />
							</NIcon>
						</NButton>
					) : (
						<NIcon size={20}>
							<Language />
						</NIcon>
					)}
				</div>
			</NDropdown>
		)
	},
})
