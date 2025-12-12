// Type Imports
import type { Ref } from 'vue'

/**
 * @description 通知提供商选项的类型定义
 */
export interface NotifyProviderOption {
	/**
	 * 选项的显示标签
	 */
	label: string
	/**
	 * 选项的实际值 (用于 NSelect 的 v-model)
	 */
	value: string
	/**
	 * 选项的原始类型 (例如 'email', 'sms'), 用于图标显示等业务逻辑
	 */
	type: string
}

/**
 * @description 从 Store 获取的原始通知提供商项目类型
 * @remark 请根据实际 Store 中 `notifyProvider.value` 的具体项结构调整此类型。
 */
export interface RawProviderItem {
	/**
	 * 显示标签
	 */
	label: string
	/**
	 * 实际值
	 */
	value: string
	/**
	 * 原始类型
	 */
	type: string
	/**
	 * 允许其他可能的属性，但建议明确列出所有已知属性以增强类型安全
	 */
	[key: string]: any
}

/**
 * @description NotifyProviderSelect 组件的 Props 定义
 */
export interface NotifyProviderSelectProps {
	/**
	 * 表单项的路径，用于表单校验或上下文
	 * @default ''
	 */
	path: string
	/**
	 * 当前选中的值 (对应 NotifyProviderOption['value'])
	 * @default ''
	 */
	value: string
	/**
	 * 决定 `props.value` 和 `NotifyProviderOption.value` 字段是基于原始提供商的 `value` 还是 `type`
	 * - 'value': 使用原始提供商的 `value` 字段作为 `NotifyProviderOption.value`
	 * - 'type': 使用原始提供商的 `type` 字段作为 `NotifyProviderOption.value`
	 * @default 'value'
	 */
	valueType: 'value' | 'type'
	/**
	 * 是否为添加模式，显示额外的按钮
	 * @default false
	 */
	isAddMode: boolean
}

// Controller暴露给View的类型
export interface NotifyProviderSelectControllerExposes {
	/**
	 * 内部选中的完整通知提供商对象
	 */
	selectedOptionFull: Ref<NotifyProviderOption>
	/**
	 * 格式化后用于 NSelect 的选项列表
	 */
	selectOptions: Ref<NotifyProviderOption[]>
	/**
	 * 打开通知渠道配置页面的方法
	 */
	goToAddNotifyProvider: () => void
	/**
	 * 处理 NSelect 值更新的方法
	 */
	handleSelectUpdate: (value: string) => void
	/**
	 * 手动刷新通知提供商列表的方法
	 */
	fetchNotifyProviderData: () => void
}
