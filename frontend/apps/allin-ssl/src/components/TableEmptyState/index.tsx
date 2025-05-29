import { $t } from '@locales/index'
import { NEmpty, NButton } from 'naive-ui'
import { defineComponent, type PropType } from 'vue' // Added PropType, vue after naive-ui if sorted strictly by name

/**
 * @description 表格空状态提示组件，带有添加按钮和社区链接
 * @param {string} addButtonText 添加按钮文本
 * @param {() => void} onAddClick 添加按钮点击事件
 */
interface TableEmptyStateProps { // Renamed from EmptyActionPromptProps
	addButtonText: string
	onAddClick: () => void
}

export default defineComponent({
	name: 'TableEmptyState', // Renamed from EmptyActionPrompt
	props: {
		addButtonText: {
			type: String,
			required: true,
		},
		onAddClick: {
			type: Function as PropType<() => void>, // Use PropType for better type definition
			required: true,
		},
	},
	setup(props: TableEmptyStateProps) { // Use renamed interface
		return () => (
			<div class="flex justify-center items-center h-full">
				<NEmpty class="px-[4rem]">
					{$t('t_1_1747754231838')}
					<NButton text type="primary" size="small" onClick={props.onAddClick}>
						{props.addButtonText}
					</NButton>
					，{$t('t_2_1747754234999')}
					<NButton text tag="a" target="_blank" type="primary" href="https://github.com/allinssl/allinssl/issues">
						Issues
					</NButton>
					，{$t('t_3_1747754232000')}
					<NButton text tag="a" target="_blank" type="primary" href="https://github.com/allinssl/allinssl">
						Star
					</NButton>
					，{$t('t_4_1747754235407')}
				</NEmpty>
			</div>
		)
	},
})
