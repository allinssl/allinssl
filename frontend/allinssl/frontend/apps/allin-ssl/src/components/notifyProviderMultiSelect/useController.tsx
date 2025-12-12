// External Libraries
import { ref, watch, computed } from 'vue'

// Type Imports
import type {
	NotifyProviderOption,
	NotifyProviderMultiSelectControllerExposes,
	NotifyProviderMultiSelectProps,
	RawProviderItem,
} from './types'

// Absolute Internal Imports - Store
import { useStore } from '@layout/useStore'
// Absolute Internal Imports - Config
import { MessagePushConfig } from '@config/data'

/**
 * @description NotifyProviderMultiSelect 组件的控制器逻辑
 * @param props - 组件的 props
 * @param emit - 组件的 emit 函数
 * @returns {NotifyProviderMultiSelectControllerExposes} 暴露给视图的响应式数据和方法
 */
export function useNotifyProviderMultiSelectController(
	props: NotifyProviderMultiSelectProps,
	emit: (event: 'update:value', payload: NotifyProviderOption[]) => void,
): NotifyProviderMultiSelectControllerExposes {
	const { fetchNotifyProvider, notifyProvider } = useStore()

	// 内部存储当前选中的完整 NotifyProviderOption 对象数组
	const selectedOptionsFull = ref<NotifyProviderOption[]>([])
	// 存储多选组件使用的选项列表
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
	 * @description 根据当前选中的值数组更新内部完整选中项数组
	 * @param currentSelectedValues - 当前选中的值数组 (字符串数组)
	 */
	const updateInternalSelectedOptions = (currentSelectedValues: string[]): void => {
		if (!currentSelectedValues || currentSelectedValues.length === 0) {
			selectedOptionsFull.value = []
			return
		}

		const newSelectedOptions: NotifyProviderOption[] = []

		currentSelectedValues.forEach((value) => {
			// 首先尝试从当前选项列表中查找
			let foundOption = selectOptions.value.find((option) => option.value === value)

			if (!foundOption) {
				// 如果在当前选项列表中找不到，尝试从备用选项中查找
				foundOption = fallbackOptions.value.find((option) => option.value === value)
			}

			if (foundOption) {
				newSelectedOptions.push({ ...foundOption })
			} else {
				// 如果都找不到，创建一个临时选项
				newSelectedOptions.push({
					label: value,
					value: value,
					type: '',
				})
			}
		})

		selectedOptionsFull.value = newSelectedOptions
	}

	/**
	 * @description 打开通知渠道配置页面
	 */
	const goToAddNotifyProvider = (): void => {
		window.open('/settings?tab=notification', '_blank')
	}

	/**
	 * @description 处理多选组件的值更新事件
	 * @param newSelectedValues - 多选组件更新的 modelValue (字符串数组)
	 */
	const handleMultiSelectUpdate = (newSelectedValues: string[]): void => {
		updateInternalSelectedOptions(newSelectedValues)
		emit('update:value', [...selectedOptionsFull.value]) // Emit a copy of the array
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
			if (selectOptions.value.length === 0 && newVal && newVal.length > 0) {
				fetchNotifyProviderData() // 如果列表为空且有 props.value，触发加载
			}
			updateInternalSelectedOptions(newVal)
		},
		{ immediate: true, deep: true },
	)

	// 监听从 Store 获取的原始通知提供商列表，并进行转换
	watch(
		() => notifyProvider.value,
		(rawProviders) => {
			if (rawProviders && rawProviders.length > 0) {
				// 如果 Store 中有数据，使用 Store 数据
				selectOptions.value = rawProviders.map((item: RawProviderItem) => ({
					label: item.label,
					// `value` 字段给多选组件使用，根据 props.valueType 决定其来源
					value: props.valueType === 'value' ? item.value : item.type,
					// `type` 字段始终为原始提供商的 type，用于 SvgIcon
					type: item.type,
				}))
			} else {
				// 如果 Store 中没有数据，使用备用数据源
				selectOptions.value = fallbackOptions.value
			}

			// Store 数据更新后，基于当前 props.value 重新更新内部完整选中项
			updateInternalSelectedOptions(props.value)
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
		selectedOptionsFull,
		selectOptions,
		goToAddNotifyProvider,
		handleMultiSelectUpdate,
		fetchNotifyProviderData,
	}
}
