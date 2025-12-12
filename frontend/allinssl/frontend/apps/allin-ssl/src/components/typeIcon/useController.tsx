import { computed } from 'vue'
import type { AuthApiTypeIconProps, AuthApiTypeIconControllerExposes, ApiProjectConfigType } from './types'
import { ApiProjectConfig, MessagePushConfig } from '@config/data' // 从指定路径导入数据

// --- 数据处理逻辑 ---
// 这些映射表在模块加载时构建一次，供所有组件实例共享

// 用于存储从配置派生的显示名称
const typeNamesMap: Record<string, string> = {}
// 用于存储从配置派生的图标文件名（不含前缀/后缀）
const iconFileMap: Record<string, string> = {}
// 用于存储哪些键是通知类型（影响图标前缀）
const notifyKeys = new Set<string>()

// 处理 ApiProjectConfig
for (const key in ApiProjectConfig) {
	if (Object.prototype.hasOwnProperty.call(ApiProjectConfig, key)) {
		const config = ApiProjectConfig[key as keyof typeof ApiProjectConfig] as ApiProjectConfigType
		typeNamesMap[key] = config.name
		iconFileMap[key] = config.icon
		if (config?.hostRelated) {
			for (const subKey in config.hostRelated) {
				if (Object.prototype.hasOwnProperty.call(config.hostRelated, subKey)) {
					const subConfig = config.hostRelated[subKey as keyof typeof config.hostRelated]
					// 例如: 'aliyun-cdn', 'aliyun-oss'
					const fullKey = `${key}-${subKey}`
					if (fullKey) {
						typeNamesMap[fullKey] = subConfig?.name?.toString() ?? ''
						iconFileMap[fullKey] = config.icon // hostRelated 项通常使用其父配置的图标
					}
				}
			}
		}
	}
}

// 处理 MessagePushConfig
for (const key in MessagePushConfig) {
	if (Object.prototype.hasOwnProperty.call(MessagePushConfig, key)) {
		const config = MessagePushConfig[key as keyof typeof MessagePushConfig]
		typeNamesMap[key] = config.name
		// MessagePushConfig 中的 'type' 字段用作图标文件名
		iconFileMap[key] = config.type
		notifyKeys.add(key) // 标记为通知类型
	}
}

// 根据原始组件逻辑，应用特定的图标覆盖
// 例如：如果 'btwaf' 需要强制使用 'btpanel' 图标，即使其在 ApiProjectConfig.btwaf.icon 中有其他定义
if (ApiProjectConfig.btwaf) {
	iconFileMap['btwaf'] = 'btpanel' // 确保 btwaf 使用宝塔面板图标
}

/**
 * @function useAuthApiTypeIconController
 * @description AuthApiTypeIcon 组件的控制器逻辑，支持单个或多个图标。
 * @param props - 组件的 props。
 * @returns {AuthApiTypeIconControllerExposes} 控制器暴露给视图的数据和方法。
 */
export function useAuthApiTypeIconController(props: AuthApiTypeIconProps): AuthApiTypeIconControllerExposes {
	/**
	 * @computed iconPath
	 * @description 根据 props.icon 计算 SvgIcon 所需的图标名称。支持单个或多个图标。
	 */
	const iconPath = computed<string>(() => {
		// 如果是数组，取第一个作为主要图标
		const iconKey = Array.isArray(props.icon) ? props.icon[0] : props.icon
		if (!iconKey) return 'resources-default'

		const isNotify = notifyKeys.has(iconKey)
		const RESOURCE_PREFIX = isNotify ? 'notify-' : 'resources-'
		// 从映射表中获取图标文件名，如果找不到则使用 'default'
		const iconStem = iconFileMap[iconKey] || 'default'
		return RESOURCE_PREFIX + iconStem
	})

	/**
	 * @computed typeName
	 * @description 根据 props.icon 获取对应的显示名称。支持单个或多个名称。
	 */
	const typeName = computed<string>(() => {
		if (Array.isArray(props.icon)) {
			// 如果是数组，组合多个名称
			return props.icon
				.filter(Boolean)
				.map((iconKey) => typeNamesMap[iconKey] || iconKey)
				.join(', ')
		} else {
			// 单个图标的处理
			return typeNamesMap[props.icon] || props.icon
		}
	})

	/**
	 * @computed iconItems
	 * @description 计算所有图标项，用于多图标显示
	 */
	const iconItems = computed(() => {
		const icons = Array.isArray(props.icon) ? props.icon : [props.icon]
		return icons.filter(Boolean).map((iconKey) => {
			const isNotify = notifyKeys.has(iconKey)
			const RESOURCE_PREFIX = isNotify ? 'notify-' : 'resources-'
			const iconStem = iconFileMap[iconKey] || 'default'
			return {
				iconPath: RESOURCE_PREFIX + iconStem,
				typeName: typeNamesMap[iconKey] || iconKey,
				key: iconKey,
			}
		})
	})

	return {
		iconPath,
		typeName,
		iconItems,
	}
}
