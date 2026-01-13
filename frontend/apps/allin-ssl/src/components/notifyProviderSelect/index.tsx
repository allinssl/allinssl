// External Libraries
import { defineComponent, computed } from 'vue'
import { NButton, NDivider, NFlex, NFormItemGi, NGi, NGrid, NSelect, NText } from 'naive-ui'

// Type Imports
import type { VNode, PropType } from 'vue'
import type { SelectOption } from 'naive-ui'
import type { NotifyProviderOption, NotifyProviderSelectProps } from './types'

// Absolute Internal Imports - Components
import SvgIcon from '@components/SvgIcon'
// Absolute Internal Imports - Utilities / Others
import { $t } from '@locales/index'

// Relative Internal Imports - Controller
import { useNotifyProviderSelectController } from './useController'

/**
 * @description 通知提供商选择组件。允许用户从列表中选择一个通知渠道。
 * @example
 * <NotifyProviderSelect
 *   path="form.channel"
 *   v-model:value="selectedChannelValue"
 *   valueType="value"
 *   :isAddMode="true"
 *   @update:value="(option) => handleChannelChange(option)"
 * />
 */
export default defineComponent({
	name: 'NotifyProviderSelect',
	props: {
		/**
		 * 表单项的路径，用于表单校验或上下文。
		 * @default ''
		 */
		path: {
			type: String as PropType<NotifyProviderSelectProps['path']>,
			default: '',
		},
		/**
		 * 当前选中的值 (对应 NotifyProviderOption['value']，即 NSelect 的 modelValue)。
		 * @default ''
		 */
		value: {
			type: String as PropType<NotifyProviderSelectProps['value']>,
			default: '',
		},
		/**
		 * 决定 `props.value` 和 `NotifyProviderOption.value` 字段是基于原始提供商的 `value` 还是 `type`。
		 * - 'value': 使用原始提供商的 `value` 字段作为 `NotifyProviderOption.value`。
		 * - 'type': 使用原始提供商的 `type` 字段作为 `NotifyProviderOption.value`。
		 * @default 'value'
		 */
		valueType: {
			type: String as PropType<NotifyProviderSelectProps['valueType']>,
			default: 'value',
			validator: (val: string) => ['value', 'type'].includes(val),
		},
		/**
		 * 是否为添加模式，显示额外的"新增渠道"和"刷新"按钮。
		 * @default false
		 */
		isAddMode: {
			type: Boolean as PropType<NotifyProviderSelectProps['isAddMode']>,
			default: false,
		},
	},
	/**
	 * @event update:value - 当选中的通知提供商更新时触发。
	 * @param {NotifyProviderOption} option - 选中的通知提供商的完整对象 (`{ label: string, value: string, type: string }`)。
	 */
	emits: {
		'update:value': (payload: NotifyProviderOption) => {
			return (
				typeof payload === 'object' && payload !== null && 'label' in payload && 'value' in payload && 'type' in payload
			)
		},
	},
	setup(props: NotifyProviderSelectProps, { emit }) {
		const { selectOptions, goToAddNotifyProvider, handleSelectUpdate, fetchNotifyProviderData } =
			useNotifyProviderSelectController(props, emit)

		/**
		 * @description 渲染 NSelect 中已选项的标签 (Tag)。
		 * @param {object} params - Naive UI 传递的选项包装对象。
		 * @param {SelectOption} params.option - 当前选项的数据。
		 * @returns {VNode} 渲染后的 VNode。
		 */
		const renderSingleSelectTag = ({ option }: { option: SelectOption }): VNode => {
			// 将 SelectOption 转换为 NotifyProviderOption
			const notifyOption = option as NotifyProviderOption & SelectOption
			return (
				<div class="flex items-center">
					{notifyOption.label ? (
						<NFlex align="center" size="small">
							<SvgIcon icon={`notify-${notifyOption.type || ''}`} size="1.6rem" />
							<NText>{notifyOption.label}</NText>
						</NFlex>
					) : (
						<NText depth="3">{$t('t_0_1745887835267')}</NText>
					)}
				</div>
			)
		}

		/**
		 * @description 渲染 NSelect 下拉列表中的选项标签。
		 * @param {SelectOption} option - 当前选项的数据。
		 * @returns {VNode} 渲染后的 VNode。
		 */
		const renderLabel = (option: SelectOption): VNode => {
			// 将 SelectOption 转换为 NotifyProviderOption
			const notifyOption = option as NotifyProviderOption & SelectOption
			return (
				<NFlex align="center" size="small">
					<SvgIcon icon={`notify-${notifyOption.type || ''}`} size="1.6rem" />
					<NText>{notifyOption.label}</NText>
				</NFlex>
			)
		}

		// 转换选项格式以兼容 NSelect
		const naiveSelectOptions = computed(() => {
			return selectOptions.value.map((option): SelectOption & NotifyProviderOption => ({
				...option,
				// 确保兼容 NSelect 的 SelectOption 接口
			}))
		})

		return () => (
			<NGrid cols={24}>
				<NFormItemGi span={props.isAddMode ? 13 : 24} label={$t('t_1_1745887832941') /* 通知渠道 */} path={props.path}>
					<NSelect
						class="flex-1 w-full"
						options={naiveSelectOptions.value}
						renderLabel={renderLabel}
						renderTag={renderSingleSelectTag}
						filterable
						clearable
						placeholder={$t('t_0_1745887835267')}
						value={props.value} // 直接使用 props.value
						onUpdateValue={handleSelectUpdate}
						v-slots={{
							empty: () => (
								<div class="text-center py-4">
									<NText depth="3" class="text-[1.4rem]">
										{selectOptions.value.length === 0 ? $t('t_0_1745887835267') : '暂无匹配的通知渠道'}
									</NText>
								</div>
							),
						}}
					/>
				</NFormItemGi>
				{props.isAddMode && (
					<NGi span={11}>
						<div class="flex items-center h-full">
							<NDivider vertical />
							<NButton class="mx-[8px]" onClick={goToAddNotifyProvider} ghost>
								{$t('t_2_1745887834248')}
							</NButton>
							<NButton onClick={fetchNotifyProviderData} ghost>
								{$t('t_0_1746497662220')}
							</NButton>
						</div>
					</NGi>
				)}
			</NGrid>
		)
	},
})
