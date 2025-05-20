import { defineComponent, VNode } from 'vue'
import { NButton, NFlex, NFormItemGi, NGrid, NSelect, NText } from 'naive-ui'
import { $t } from '@locales/index'
import { useStore } from '@layout/useStore'
import SvgIcon from '@components/svgIcon'

interface NotifyProviderOption {
	label: string
	value: string
	type: string
}

interface NotifyProviderSelectProps {
	path: string
	value: string
	valueType: 'value' | 'type'
	isAddMode: boolean
}

export default defineComponent({
	name: 'NotifyProviderSelect',
	props: {
		// 表单，用于绑定表单的值
		path: {
			type: String,
			default: '',
		},
		// 表单的值
		value: {
			type: String,
			default: '',
		},
		// 表单的值类型
		valueType: {
			type: String,
			default: 'value',
		},

		// 是否为添加模式
		isAddMode: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:value'],
	setup(props: NotifyProviderSelectProps, { emit }) {
		// 获取消息通知提供商
		const { fetchNotifyProvider, notifyProvider } = useStore()
		// 表单的值
		const param = ref<NotifyProviderOption>({
			label: '',
			value: '',
			type: '',
		})
		const notifyProviderRef = ref<NotifyProviderOption[]>([])

		/**
		 * 打开通知渠道配置页面
		 */
		const goToAddNotifyProvider = () => {
			window.open('/settings?tab=notification', '_blank')
		}

		/**
		 * 渲染单选标签
		 * @param option - 选项
		 * @returns 渲染后的VNode
		 */
		const renderSingleSelectTag = ({ option }: Record<string, any>): VNode => {
			return (
				<div class="flex items-center">
					{option.label ? (
						<NFlex>
							<SvgIcon icon={`notify-${props.valueType === 'value' ? option.type : option.value}`} size="2rem" />
							<NText>{option.label}</NText>
						</NFlex>
					) : (
						<NText>{$t('t_0_1745887835267')}</NText>
					)}
				</div>
			)
		}

		/**
		 * 渲染标签
		 * @param option - 选项
		 * @returns 渲染后的VNode
		 */
		const renderLabel = (option: NotifyProviderOption): VNode => {
			return (
				<NFlex>
					<SvgIcon icon={`notify-${props.valueType === 'value' ? option.type : option.value}`} size="2rem" />
					<NText>{option.label}</NText>
				</NFlex>
			)
		}

		/**
		 * @description 更新类型
		 * @param option - 选项
		 * @param value - 值
		 */
		const handleUpdateType = (value: string) => {
			if (!value) return
			const row = notifyProviderRef.value.find((item) => {
				return item.value === value
			})
			param.value = {
				label: row?.label || '',
				value: row?.value || '',
				type: row?.type || '',
			}
		}

		/**
		 * 更新表单的值
		 * @param value - 表单的值
		 */
		const handleUpdateValue = (value: string) => {
			handleUpdateType(value)
			emit('update:value', param.value)
		}

		// 监听父组件的值
		watch(
			() => props.value,
			(newVal) => {
				fetchNotifyProvider()
				handleUpdateType(newVal)
			},
			{ immediate: true },
		)

		// 监听消息通知提供商
		watch(
			() => notifyProvider.value,
			(newVal) => {
				notifyProviderRef.value =
					newVal.map((item) => ({
						label: item.label,
						value: props.valueType === 'value' ? item.value : item.type,
						type: props.valueType === 'value' ? item.type : item.value,
					})) || []
				handleUpdateType(props.value)
			},
		)

		return () => (
			<NGrid cols={24}>
				<NFormItemGi span={props.isAddMode ? 13 : 24} label={$t('t_1_1745887832941')} path={props.path}>
					<NSelect
						class="flex-1 w-full "
						options={notifyProviderRef.value}
						renderLabel={renderLabel}
						renderTag={renderSingleSelectTag}
						filterable
						placeholder={$t('t_0_1745887835267')}
						v-model:value={param.value.value}
						onUpdateValue={handleUpdateValue}
						v-slots={{
							empty: () => {
								return <span class="text-[1.4rem]">{$t('t_0_1745887835267')}</span>
							},
						}}
					/>
				</NFormItemGi>
				{props.isAddMode && (
					<NFormItemGi span={11}>
						<NButton class="mx-[8px]" onClick={goToAddNotifyProvider}>
							{$t('t_2_1745887834248')}
						</NButton>
						<NButton onClick={fetchNotifyProvider}>{$t('t_0_1746497662220')}</NButton>
					</NFormItemGi>
				)}
			</NGrid>
		)
	},
})
