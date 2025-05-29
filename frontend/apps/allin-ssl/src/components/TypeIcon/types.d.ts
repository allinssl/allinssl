/**
 * AuthApiTypeIcon 组件的 Props 接口。
 */
export interface AuthApiTypeIconProps {
	/**
	 * 图标类型键。
	 * 该键用于从 /lib/data.tsx 配置中查找对应的图标和名称。
	 * 如果未在配置中找到，将尝试使用 'default' 图标，并直接显示该键作为文本。
	 */
	icon: string
	/**
	 * NTag 的类型。
	 * @default 'default'
	 */
	type?: 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error'
	/**
	 * 文本是否显示。
	 * @default true
	 */
	text?: boolean
}

/**
 * useAuthApiTypeIconController Composable 函数暴露的接口。
 */
export interface AuthApiTypeIconControllerExposes {
	/** 计算得到的图标路径 */
	iconPath: globalThis.ComputedRef<string>
	/** 计算得到的类型名称，用于显示 */
	typeName: globalThis.ComputedRef<string>
}

/**
 * ApiProjectConfig 的类型定义。
 * 描述了 API 项目配置的结构。
 */
export interface ApiProjectConfigType {
	name: string
	icon: string
	hostRelated?: Record<string, Record<string, { name: string }>>
}
