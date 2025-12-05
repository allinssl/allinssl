// External Libraries
import { defineComponent, computed } from 'vue'
import { NButton, NDivider, NFlex, NFormItemGi, NGi, NGrid, NSelect, NText, NCheckboxGroup, NCheckbox } from 'naive-ui'

// Type Imports
import type { VNode, PropType } from 'vue'
import type { SelectOption } from 'naive-ui'
import type { NotifyProviderOption, NotifyProviderMultiSelectProps } from './types'

// Absolute Internal Imports - Components
import SvgIcon from '@components/SvgIcon'
// Absolute Internal Imports - Utilities / Others
import { $t } from '@locales/index'

// Relative Internal Imports - Controller
import { useNotifyProviderMultiSelectController } from './useController'
// Relative Internal Imports - Styles
import styles from './index.module.css'

/**
 * @description 通知提供商多选组件。允许用户从列表中选择多个通知渠道。
 * @example
 * <NotifyProviderMultiSelect
 *   path="form.channels"
 *   v-model:value="selectedChannelValues"
 *   valueType="type"
 *   :isAddMode="true"
 *   @update:value="(options) => handleChannelsChange(options)"
 * />
 */
export default defineComponent({
	name: 'NotifyProviderMultiSelect',
	props: {
		/**
		 * 表单项的路径，用于表单校验或上下文。
		 * @default ''
		 */
		path: {
			type: String as PropType<NotifyProviderMultiSelectProps['path']>,
			default: '',
		},
		/**
		 * 当前选中的值数组 (对应 NotifyProviderOption['value'][] 数组)。
		 * @default []
		 */
		value: {
			type: Array as PropType<NotifyProviderMultiSelectProps['value']>,
			default: () => [],
		},
		/**
		 * 决定 `props.value` 和 `NotifyProviderOption.value` 字段是基于原始提供商的 `value` 还是 `type`。
		 * - 'value': 使用原始提供商的 `value` 字段作为 `NotifyProviderOption.value`。
		 * - 'type': 使用原始提供商的 `type` 字段作为 `NotifyProviderOption.value`。
		 * @default 'value'
		 */
		valueType: {
			type: String as PropType<NotifyProviderMultiSelectProps['valueType']>,
			default: 'value',
			validator: (val: string) => ['value', 'type'].includes(val),
		},
		/**
		 * 是否为添加模式，显示额外的"新增渠道"和"刷新"按钮。
		 * @default false
		 */
		isAddMode: {
			type: Boolean as PropType<NotifyProviderMultiSelectProps['isAddMode']>,
			default: false,
		},
		/**
		 * 最大选择数量限制。
		 * @default undefined
		 */
		maxCount: {
			type: Number as PropType<NotifyProviderMultiSelectProps['maxCount']>,
			default: undefined,
		},
		/**
		 * 是否禁用。
		 * @default false
		 */
		disabled: {
			type: Boolean as PropType<NotifyProviderMultiSelectProps['disabled']>,
			default: false,
		},
	},
	/**
	 * @event update:value - 当选中的通知提供商更新时触发。
	 * @param {NotifyProviderOption[]} options - 选中的通知提供商的完整对象数组。
	 */
	emits: {
		'update:value': (payload: NotifyProviderOption[]) => {
			return (
				Array.isArray(payload) &&
				payload.every(
					(item) => typeof item === 'object' && item !== null && 'label' in item && 'value' in item && 'type' in item,
				)
			)
		},
	},
	setup(props: NotifyProviderMultiSelectProps, { emit }) {
		const { selectOptions, goToAddNotifyProvider, handleMultiSelectUpdate, fetchNotifyProviderData } =
			useNotifyProviderMultiSelectController(props, emit)

		/**
		 * @description 渲染多选标签 (Tag)。
		 * @param {object} params - Naive UI 传递的选项包装对象。
		 * @param {SelectOption} params.option - 当前选项的数据。
		 * @returns {VNode} 渲染后的 VNode。
		 */
		const renderMultiSelectTag = ({ option }: { option: SelectOption }): VNode => {
			// 将 SelectOption 转换为 NotifyProviderOption
			const notifyOption = option as NotifyProviderOption & SelectOption

			// 处理长标签文本的截断
			const truncateText = (text: string, maxLength: number = 20): string => {
				if (text.length <= maxLength) return text
				return text.slice(0, maxLength) + '...'
			}

			return (
				<div class="flex items-center max-w-full h-full">
					{notifyOption.label ? (
						<NFlex align="center" justify="center" size="small" class="min-w-0 flex-1 h-full">
							<SvgIcon icon={`notify-${notifyOption.type || ''}`} size="1.4rem" class="flex-shrink-0" />
							<span
								class="text-[12px] truncate min-w-0 block"
								title={notifyOption.label}
								style={{
									maxWidth: '120px',
									lineHeight: '1.5',
									display: 'flex',
									alignItems: 'center',
								}}
							>
								{truncateText(notifyOption.label)}
							</span>
						</NFlex>
					) : (
						<NText depth="3" class="text-[12px] flex items-center h-full">
							{$t('t_0_1745887835267')}
						</NText>
					)}
				</div>
			)
		}

		/**
		 * @description 渲染下拉列表中的选项标签。
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
			<div class={styles.notifyProviderMultiSelect}>
				<NGrid cols={24}>
					<NFormItemGi
						span={props.isAddMode ? 13 : 24}
						label={$t('t_1_1745887832941') /* 通知渠道 */}
						path={props.path}
					>
						<div class={styles.selectContainer}>
							<NSelect
								class="w-full"
								style={{
									'--n-tag-text-color': 'var(--n-text-color)',
									'--n-tag-border-radius': '6px',
									'min-height': '2.5rem',
									'--n-height': '2.5rem',
									'--n-height-medium': '2.5rem',
								}}
								options={naiveSelectOptions.value}
								renderLabel={renderLabel}
								renderTag={renderMultiSelectTag}
								filterable
								clearable
								multiple
								maxTagCount="responsive"
								placeholder={$t('t_0_1745887835267')}
								value={props.value} // 直接使用 props.value 数组
								onUpdateValue={handleMultiSelectUpdate}
								disabled={props.disabled}
								v-slots={{
									empty: () => (
										<div class={styles.emptyState}>
											<NText depth="3" class="text-[1.4rem]">
												{selectOptions.value.length === 0 ? $t('t_0_1745887835267') : '暂无匹配的通知渠道'}
											</NText>
										</div>
									),
								}}
							/>
						</div>
					</NFormItemGi>
					{props.isAddMode && (
						<NGi span={11}>
							<div class="flex items-center h-full">
								<NDivider vertical />
								<NButton class="flex-1 table-action-btn mx-[8px]" onClick={goToAddNotifyProvider} ghost>
									{$t('t_2_1745887834248')}
								</NButton>
								<NButton class="table-action-btn" onClick={fetchNotifyProviderData} ghost>
									{$t('t_0_1746497662220')}
								</NButton>
							</div>
						</NGi>
					)}
				</NGrid>
			</div>
		)
	},
})
