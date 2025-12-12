// 类型导入 (如果需要)
// import type { SomeOtherType } from '@/types/someModule';

/**
 * @interface DnsProviderOption
 * @description DNS提供商选项的结构
 */
export interface DnsProviderOption {
	label: string
	value: string
	type: string
	data: Record<string, any>
}

/**
 * @type DnsProviderType
 * @description DNS提供商的具体类型
 */
export type DnsProviderType =
	| 'aliyun'
	| 'tencentcloud'
	| 'baidu'
	| 'qiniu'
	| 'huaweicloud'
	| 'cloudflare'
	| 'dns'
	| 'btpanel'
	| '1panel'
	| 'ssh'
	| ''

/**
 * @interface DnsProviderSelectProps
 * @description DnsProviderSelect 组件的 Props 定义
 */
export interface DnsProviderSelectProps {
	/**
	 * @property type
	 * @description 表单类型，用于获取不同的下拉列表
	 */
	type: DnsProviderType
	/**
	 * @property path
	 * @description 表单路径，用于 naive-ui 表单校验
	 */
	path: string
	/**
	 * @property value
	 * @description 当前选中的值
	 */
	value: string
	/**
	 * @property valueType
	 * @description 表单值的类型，决定 emit 出去的是选项的 value 还是 type
	 */
	valueType: 'value' | 'type'
	/**
	 * @property isAddMode
	 * @description 是否为添加模式，控制是否显示"添加"和"刷新"按钮
	 */
	isAddMode: boolean
	/**
	 * @property disabled
	 * @description 是否禁用选择器
	 * @default false
	 */
	disabled?: boolean
	/**
	 * @property customClass
	 * @description 自定义CSS类名，应用于 NGrid 组件
	 */
	customClass?: string
}

/**
 * @interface DnsProviderSelectEmits
 * @description DnsProviderSelect 组件的 Emits 定义
 */
export interface DnsProviderSelectEmits {
	(e: 'update:value', value: DnsProviderOption): void
}

/**
 * @interface DnsProviderControllerExposes
 * @description useDnsProviderSelectController 返回对象的类型接口
 */
export interface DnsProviderControllerExposes {
	param: import('vue').Ref<DnsProviderOption>
	dnsProviderRef: import('vue').Ref<DnsProviderOption[]>
	isLoading: import('vue').Ref<boolean>
	errorMessage: import('vue').Ref<string>
	goToAddDnsProvider: () => void
	handleUpdateValue: (value: string) => void
	loadDnsProviders: (type?: DnsProviderType) => Promise<void>
	handleFilter: (pattern: string, option: DnsProviderOption) => boolean
}
