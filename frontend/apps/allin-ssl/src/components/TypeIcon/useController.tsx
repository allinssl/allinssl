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
 * @description AuthApiTypeIcon 组件的控制器逻辑。
 * @param props - 组件的 props。
 * @returns {AuthApiTypeIconControllerExposes} 控制器暴露给视图的数据和方法。
 */
export function useAuthApiTypeIconController(props: AuthApiTypeIconProps): AuthApiTypeIconControllerExposes {
	/**
	 * @computed iconPath
	 * @description 根据 props.icon 计算 SvgIcon 所需的图标名称。
	 */
	const iconPath = computed<string>(() => {
		const isNotify = notifyKeys.has(props.icon)
		const RESOURCE_PREFIX = isNotify ? 'notify-' : 'resources-'
		// 从映射表中获取图标文件名，如果找不到则使用 'default'
		const iconStem = iconFileMap[props.icon] || 'default'
		return RESOURCE_PREFIX + iconStem
	})

	/**
	 * @computed typeName
	 * @description 根据 props.icon 获取对应的显示名称。
	 */
	const typeName = computed<string>(() => {
		// 从映射表中获取显示名称，如果找不到则直接使用 props.icon
		return typeNamesMap[props.icon] || props.icon
	})

	return {
		iconPath,
		typeName,
	}
}
