// External Libraries
import { ref, watch, computed } from 'vue'

// Type Imports
import type {
	NotifyProviderOption,
	NotifyProviderSelectControllerExposes,
	NotifyProviderSelectProps,
	RawProviderItem,
} from './types'

// Absolute Internal Imports - Store
import { useStore } from '@layout/useStore' // 假设这是正确的 Store 路径
// Absolute Internal Imports - Config
import { MessagePushConfig } from '@config/data'

/**
 * @description NotifyProviderSelect 组件的控制器逻辑
 * @param props - 组件的 props
 * @param emit - 组件的 emit 函数
 * @returns {NotifyProviderSelectControllerExposes} 暴露给视图的响应式数据和方法
 */
export function useNotifyProviderSelectController(
	props: NotifyProviderSelectProps,
	emit: (event: 'update:value', payload: NotifyProviderOption) => void,
): NotifyProviderSelectControllerExposes {
	const { fetchNotifyProvider, notifyProvider } = useStore()

	// 内部存储当前选中的完整 NotifyProviderOption 对象
	const selectedOptionFull = ref<NotifyProviderOption>({ label: '', value: '', type: '' })
	// 存储 NSelect 使用的选项列表
	const selectOptions = ref<NotifyProviderOption[]>([])

	/**
	 * @description 从 MessagePushConfig 生成备用选项列表
	 */
	const fallbackOptions = computed<NotifyProviderOption[]>(() => {
		return Object.entries(MessagePushConfig).map(([key, config]) => ({
			label: config.name,
			value: props.valueType === 'value' ? key : config.type,
			type: config.type,
		}))
	})

	/**
	 * @description 根据 NSelect 的 modelValue (通常是 option.value 字符串) 更新内部完整的选中项对象
	 * @param currentSelectValue - NSelect 当前的 modelValue (字符串)
	 */
	const updateInternalSelectedOption = (currentSelectValue: string) => {
		if (!currentSelectValue) {
			selectedOptionFull.value = { label: '', value: '', type: '' }
			return
		}

		// 优先从当前选项列表中查找
		const foundOption = selectOptions.value.find((item) => item.value === currentSelectValue)
		if (foundOption) {
			selectedOptionFull.value = { ...foundOption }
			return
		}

		// 如果在当前列表中找不到，尝试从备用选项中查找
		const fallbackOption = fallbackOptions.value.find((item) => item.value === currentSelectValue)
		if (fallbackOption) {
			selectedOptionFull.value = { ...fallbackOption }
			return
		}

		// 如果都找不到，创建一个临时选项
		selectedOptionFull.value = {
			label: currentSelectValue,
			value: currentSelectValue,
			type: '',
		}
	}

	/**
	 * @description 打开通知渠道配置页面
	 */
	const goToAddNotifyProvider = (): void => {
		window.open('/settings?tab=notification', '_blank')
	}

	/**
	 * @description 处理 NSelect 组件的值更新事件
	 * @param newSelectedValue - NSelect 更新的 modelValue (字符串)
	 */
	const handleSelectUpdate = (newSelectedValue: string): void => {
		updateInternalSelectedOption(newSelectedValue)
		emit('update:value', { ...selectedOptionFull.value }) // Emit a copy
	}

	/**
	 * @description 外部调用以刷新通知提供商列表
	 */
	const fetchNotifyProviderData = (): void => {
		fetchNotifyProvider()
	}

	// 监听父组件传入的 props.value (可能是初始值或外部更改)
	watch(
		() => props.value,
		(newVal) => {
			// 确保提供商列表已加载或正在加载，然后再尝试更新选中项细节
			if (selectOptions.value.length === 0 && newVal) {
				fetchNotifyProviderData() // 如果列表为空且有 props.value，触发加载
			}
			updateInternalSelectedOption(newVal)
		},
		{ immediate: true },
	)

	// 监听从 Store 获取的原始通知提供商列表，并进行转换
	watch(
		() => notifyProvider.value, // notifyProvider.value 应该是原始提供商列表
		(rawProviders) => {
			if (rawProviders && rawProviders.length > 0) {
				// 如果 Store 中有数据，使用 Store 数据
				selectOptions.value = rawProviders.map((item: RawProviderItem) => ({
					label: item.label,
					// `value` 字段给 NSelect 使用，根据 props.valueType 决定其来源
					value: props.valueType === 'value' ? item.value : item.type,
					// `type` 字段始终为原始提供商的 type，用于 SvgIcon
					type: item.type,
				}))
			} else {
				// 如果 Store 中没有数据，使用备用数据源
				selectOptions.value = fallbackOptions.value
			}

			// Store 数据更新后，基于当前 props.value (NSelect 的 modelValue) 重新更新内部完整选中项
			updateInternalSelectedOption(props.value)
		},
		{ immediate: true, deep: true },
	)

	// 初始化时如果 Store 为空，先使用备用数据
	if (!notifyProvider.value || notifyProvider.value.length === 0) {
		selectOptions.value = fallbackOptions.value
		// 尝试获取 Store 数据
		fetchNotifyProviderData()
	}

	return {
		selectedOptionFull,
		selectOptions,
		goToAddNotifyProvider,
		handleSelectUpdate,
		fetchNotifyProviderData,
	}
}
