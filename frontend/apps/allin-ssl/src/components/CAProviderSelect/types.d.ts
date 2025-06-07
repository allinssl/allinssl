/**
 * @interface CAProviderOption
 * @description CA授权选项的结构
 */
export interface CAProviderOption {
	label: string
	value: string
	ca: string
	email: string
}

/**
 * @interface CAProviderSelectProps
 * @description CAProviderSelect 组件的 Props 定义
 */
export interface CAProviderSelectProps {
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
	 * @property ca
	 * @description 当前选中的CA类型
	 */
	ca: string
	/**
	 * @property email
	 * @description 邮箱地址，编辑时从工作流content中传入，新建时为空
	 */
	email: string
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
 * @interface CAProviderSelectEmits
 * @description CAProviderSelect 组件的 Emits 定义
 */
export interface CAProviderSelectEmits {
	(e: 'update:value', value: { value: string; ca: string; email: string }): void
	(e: 'update:email', email: string): void
}

/**
 * @interface CAProviderControllerExposes
 * @description useCAProviderSelectController 返回对象的类型接口
 */
export interface CAProviderControllerExposes {
	param: import('vue').Ref<CAProviderOption>
	caProviderRef: import('vue').Ref<CAProviderOption[]>
	isLoading: import('vue').Ref<boolean>
	errorMessage: import('vue').Ref<string>
	goToAddCAProvider: () => void
	handleUpdateValue: (value: string) => void
	loadCAProviders: () => Promise<void>
	handleFilter: (pattern: string, option: CAProviderOption) => boolean
}
