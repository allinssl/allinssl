import { ref, Ref, toRef, effectScope, onScopeDispose, shallowRef, toRefs, watch, isRef } from 'vue'
import {
	NForm,
	NFormItem,
	NGrid,
	NInput,
	NInputNumber,
	NInputGroup,
	NSelect,
	NRadio,
	NRadioGroup,
	NRadioButton,
	NCheckbox,
	NCheckboxGroup,
	NSwitch,
	NDatePicker,
	NTimePicker,
	NColorPicker,
	NSlider,
	NRate,
	NTransfer,
	NMention,
	NDynamicInput,
	NDynamicTags,
	NAutoComplete,
	NCascader,
	NTreeSelect,
	NUpload,
	NUploadDragger,
	type FormInst,
	NFormItemGi,
	NIcon,
	NDivider,
	type InputProps,
	type InputNumberProps,
	type SelectProps,
	type RadioProps,
	type RadioButtonProps,
	type SwitchProps,
	type DatePickerProps,
	type TimePickerProps,
	type SliderProps,
	type SelectOption,
	type FormProps,
	type FormItemProps,
	type CheckboxGroupProps,
	SwitchSlots,
} from 'naive-ui'
import { LeftOutlined, DownOutlined } from '@vicons/antd'
import { translation, TranslationModule, type TranslationLocale } from '../locals/translation'
import type {
	FormInstanceWithComponent,
	UseFormOptions,
	FormItemConfig,
	GridItemConfig,
	FormElement,
	SlotFormElement,
	RenderFormElement,
	FormElementType,
	BaseFormElement,
	FormItemGiConfig,
	RadioOptionItem,
	CheckboxOptionItem,
	FormConfig,
	FormElementPropsMap,
} from '../types/form'

// 获取当前语言
const currentLocale = localStorage.getItem('locale-active') || 'zhCN'

// 获取翻译文本
const hookT = (key: string, params?: string) => {
	const locale = currentLocale.replace('-', '_').replace(/"/g, '') as TranslationLocale
	const translationFn =
		(translation[locale as TranslationLocale] as TranslationModule).useForm[
			key as keyof TranslationModule['useForm']
		] || translation.zhCN.useForm[key as keyof typeof translation.zhCN.useForm]
	return typeof translationFn === 'function' ? translationFn(params || '') : translationFn
}

/**
 * 组件映射表：将表单元素类型映射到对应的 Naive UI 组件
 * 包含所有支持的表单控件组件
 */
const componentMap = {
	input: NInput, // 输入框
	inputNumber: NInputNumber, // 数字输入框
	inputGroup: NInputGroup, // 输入框组
	select: NSelect, // 选择器
	radio: NRadio, // 单选框组
	radioButton: NRadioButton, // 单选按钮
	checkbox: NCheckbox, // 复选框组
	switch: NSwitch, // 开关
	datepicker: NDatePicker, // 日期选择器
	timepicker: NTimePicker, // 时间选择器
	colorPicker: NColorPicker, // 颜色选择器
	slider: NSlider, // 滑块
	rate: NRate, // 评分
	transfer: NTransfer, // 穿梭框
	mention: NMention, // 提及
	dynamicInput: NDynamicInput, // 动态输入
	dynamicTags: NDynamicTags, // 动态标签
	autoComplete: NAutoComplete, // 自动完成
	cascader: NCascader, // 级联选择
	treeSelect: NTreeSelect, // 树选择
	upload: NUpload, // 上传
	uploadDragger: NUploadDragger, // 拖拽上传
} as const

/**
 * 表单插槽类型定义
 * 用于定义表单中可以使用的插槽，每个插槽都是一个函数
 * 函数接收表单数据和表单实例引用作为参数，返回JSX元素
 */
type FormSlots<T> = Record<string, (formData: Ref<T>, formRef: Ref<FormInst | null>) => JSX.Element>

/**
 * 处理表单项的前缀和后缀插槽
 * @param slot 插槽配置对象
 * @returns 处理后的前缀和后缀元素数组
 */
const processFormItemSlots = (slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> }) => {
	const prefixElements = slot?.prefix
		? slot.prefix.map((item: () => JSX.Element) => ({
				type: 'render' as const,
				render: item,
			}))
		: []

	const suffixElements = slot?.suffix
		? slot.suffix.map((item: () => JSX.Element) => ({
				type: 'render' as const,
				render: item,
			}))
		: []

	return { prefixElements, suffixElements }
}

/**
 * 创建标准表单项配置
 * @param label 标签文本
 * @param key 表单字段名
 * @param type 表单元素类型
 * @param props 组件属性
 * @param itemAttrs 表单项属性
 * @param slot 插槽配置
 * @returns 标准化的表单项配置
 */
const createFormItem = <T extends keyof typeof componentMap>(
	label: string,
	key: string,
	type: T,
	props: FormElementPropsMap[T],
	itemAttrs?: FormItemProps,
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => {
	const { prefixElements, suffixElements } = processFormItemSlots(slot)
	return {
		type: 'formItem' as const,
		label,
		path: key,
		required: true,
		children: [
			...prefixElements,
			{
				type,
				field: key,
				...(type === 'input' ? { placeholder: hookT('placeholder', label) } : {}),
				...props,
			},
			...suffixElements,
		],
		...itemAttrs,
	}
}

/**
 * 表单钩子函数
 * 用于创建一个动态表单实例，提供表单的状态管理和渲染能力
 * @param options 表单配置选项，包含表单配置、请求函数和默认值等
 * @returns 返回统一的表单实例接口
 */
export default function useForm<T>(options: UseFormOptions<T>) {
	// 创建 effectScope 用于管理响应式副作用
	const scope = effectScope()
	return scope.run(() => {
		const { config, request, defaultValue = {}, rules: rulesVal } = options

		// 表单响应式状态
		const loading = ref(false) // 表单加载状态
		const formRef = ref<FormInst | null>(null) // 表单实例引用
		const data = isRef(defaultValue) ? (defaultValue as Ref<T>) : ref(defaultValue as T) // 使用ref而不是reactive，避免响应丢失
		const formConfig = ref<FormConfig>(config) // 表单配置
		const rules = shallowRef({ ...rulesVal }) // 表单验证规则

		// 表单属性配置
		const props = ref<FormProps>({
			labelPlacement: 'left',
			labelWidth: '8rem',
			// 其他可配置的表单属性
		})

		/**
		 * 渲染基础表单元素
		 * 根据配置渲染对应的Naive UI表单控件
		 * @param element 基础表单元素配置，包含类型、字段名和组件属性等
		 * @returns 返回渲染后的JSX元素，如果找不到对应组件则返回null
		 */
		const renderBaseElement = <T extends FormElementType, K extends Record<string, any>>(
			element: BaseFormElement<T>,
		) => {
			let type = element.type
			if (['textarea', 'password'].includes(type)) type = 'input'
			// 获取对应的 Naive UI 组件
			const Component = componentMap[type as keyof typeof componentMap]
			if (!Component) return null

			// 解构出组件属性，分离类型和字段名
			const { field, ...componentProps } = element
			// 处理Radio、Checkbox
			if (['radio', 'radioButton'].includes(type)) {
				// 类型断言以访问options属性
				const radioElement = element as BaseFormElement<'radio' | 'radioButton'> & { options?: RadioOptionItem[] }
				return (
					<NRadioGroup
						value={getNestedValue(data.value as K, field)}
						onUpdateValue={(val: any) => {
							setNestedValue(data.value as K, field, val)
						}}
					>
						{radioElement.options?.map((option: RadioOptionItem) =>
							type === 'radio' ? (
								<NRadio value={option.value} {...componentProps}>
									{option.label}
								</NRadio>
							) : (
								<NRadioButton value={option.value} {...componentProps}>
									{option.label}
								</NRadioButton>
							),
						)}
					</NRadioGroup>
				)
			}
			if (['checkbox'].includes(type)) {
				// 类型断言以访问options属性
				const checkboxElement = element as BaseFormElement<'checkbox'> & {
					options?: CheckboxOptionItem[]
				}
				return (
					<NCheckboxGroup
						value={getNestedValue(data.value as K, field)}
						onUpdateValue={(val: any) => {
							setNestedValue(data.value as K, field, val)
						}}
						{...componentProps}
					>
						{checkboxElement.options?.map((option: CheckboxOptionItem) => (
							<NCheckbox value={option.value} {...componentProps}>
								{option.label}
							</NCheckbox>
						))}
					</NCheckboxGroup>
				)
			}
			// 根据是否有字段名决定是否使用v-model双向绑定
			return (
				<Component
					value={getNestedValue(data.value as K, field)}
					onUpdateValue={(val: any) => {
						setNestedValue(data.value as K, field, val)
					}}
					{...componentProps}
				/>
			)
		}

		/**
		 * 渲染表单元素
		 * 统一处理所有类型的表单元素，包括插槽、自定义渲染和基础表单元素
		 * @param element 表单元素配置
		 * @param slots 插槽配置对象
		 * @returns 返回渲染后的JSX元素或null
		 */
		const renderFormElement = (element: FormElement, slots?: FormSlots<T>): JSX.Element | null => {
			// 是否是插槽元素
			const isSlotElement = (el: FormElement): el is SlotFormElement => el.type === 'slot'
			// 是否是渲染函数
			const isRenderElement = (el: FormElement): el is RenderFormElement => el.type === 'custom'
			// 是否是自定义渲染元素
			const isBaseElement = (el: FormElement): el is BaseFormElement => !isSlotElement(el) && !isRenderElement(el)

			// 处理插槽元素：使用配置的插槽函数渲染内容
			if (isSlotElement(element)) {
				return slots?.[element.slot]?.(data as unknown as Ref<T>, formRef) ?? null
			}

			// 处理自定义渲染元素：调用自定义渲染函数
			if (isRenderElement(element)) {
				console.log(data, 'data')
				return element.render(data as unknown as Ref<T>, formRef)
			}
			// 处理基础表单元素：使用组件映射表渲染对应组件
			if (isBaseElement(element)) return renderBaseElement(element)

			return null
		}

		/**
		 * 渲染表单项
		 * 创建表单项容器，可以是普通表单项或栅格布局中的表单项
		 * @param item 表单项配置，包含子元素和属性
		 * @param slots 插槽配置对象
		 * @returns 返回渲染后的表单项JSX元素
		 */
		const renderFormItem = (
			item: FormItemConfig | FormItemGiConfig | RenderFormElement | SlotFormElement,
			slots?: FormSlots<T>,
		) => {
			if (item.type === 'custom') return item.render(data as Ref<T>, formRef)
			if (item.type === 'slot') return renderFormElement(item, slots)
			const { children, type, ...itemProps } = item
			if (type === 'formItemGi') {
				return <NFormItemGi {...itemProps}>{children.map((child) => renderFormElement(child, slots))}</NFormItemGi>
			}
			return <NFormItem {...itemProps}>{children.map((child) => renderFormElement(child, slots))}</NFormItem>
		}

		/**
		 * 渲染栅格布局
		 * 创建栅格布局容器，并渲染其中的表单项
		 * @param grid 栅格配置，包含布局属性和子元素
		 * @param slots 插槽配置对象
		 * @returns 返回渲染后的栅格布局JSX元素
		 */
		const renderGrid = (grid: GridItemConfig, slots?: FormSlots<T>) => {
			const { children, ...gridProps } = grid
			return <NGrid {...gridProps}>{children.map((item) => renderFormItem(item, slots))}</NGrid>
		}

		/**
		 * 渲染完整表单组件
		 * 创建最外层的表单容器，并根据配置渲染内部的栅格或表单项
		 * @param attrs 组件属性，包含插槽配置
		 * @param context 组件上下文
		 * @returns 返回渲染后的完整表单JSX元素
		 */
		const component = (attrs: FormProps, context: { slots?: FormSlots<T> }) => (
			<NForm ref={formRef} model={data.value} rules={rules.value} labelPlacement="left" {...props} {...attrs}>
				{formConfig.value.map((item: FormConfig[0]) =>
					item.type === 'grid' ? renderGrid(item, context.slots) : renderFormItem(item, context.slots),
				)}
			</NForm>
		)

		/**
		 * 验证表单
		 * 触发表单的验证流程，检查所有字段的有效性
		 * @returns 返回一个Promise，解析为验证是否通过的布尔值
		 */
		const validate = async () => {
			if (!formRef.value) return false
			try {
				await formRef.value.validate()
				return true
			} catch {
				return false
			}
		}

		/**
		 * 提交表单
		 * 验证表单并调用提交请求函数
		 * @returns 返回一个Promise，解析为请求的响应结果
		 */
		const fetch = async () => {
			if (!request) return
			try {
				loading.value = true
				const valid = await validate()
				if (!valid) throw new Error('表单验证失败')
				return await request(data.value, formRef)
			} catch (error) {
				throw new Error('表单验证失败')
			} finally {
				loading.value = false
			}
		}

		/**
		 * 重置表单
		 * 清除表单的验证状态，并将所有字段值重置为默认值
		 */
		const reset = () => {
			formRef.value?.restoreValidation()
			data.value = Object.assign({}, isRef(defaultValue) ? defaultValue.value : defaultValue) // 重置为默认值，使用新对象以确保触发响应
		}

		// 当组件卸载时，清理所有副作用
		onScopeDispose(() => {
			scope.stop()
		})

		// 返回标准化的表单实例接口
		return {
			component, // 表单渲染组件
			example: formRef, // 当前组件实例
			data, // 响应式数据
			loading, // 加载状态
			config: formConfig, // 表单配置
			props, // 表单属性
			rules, // 验证规则
			dataToRef: () => toRefs(data.value), // 响应式数据转ref
			fetch, // 提交方法
			reset, // 重置方法
			validate, // 验证方法
		}
	}) as FormInstanceWithComponent<T>
}

/**
 * 创建一个表单输入项
 * @param {string} label 标签文本
 * @param {string} key 表单字段名
 * @param {InputProps & { class?: string }} other 输入框的额外属性
 * @param {FormItemProps & { class?: string }} itemAttrs 表单项的额外属性
 * @param {Object} slot 插槽配置
 * @returns {FormItemConfig} 表单项配置
 */
const useFormInput = (
	label: string,
	key: string,
	other?: InputProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => createFormItem(label, key, 'input', { placeholder: hookT('placeholder', label), ...other }, itemAttrs, slot)

/**
 * 创建一个表单textarea
 * @param {string} label 标签文本
 * @param {string} key 表单字段名
 * @param {InputProps & { class?: string }} other 输入框的额外属性
 * @param {FormItemProps & { class?: string }} itemAttrs 表单项的额外属性
 * @param {Object} slot 插槽配置
 * @returns {FormItemConfig} 表单项配置
 */
const useFormTextarea = (
	label: string,
	key: string,
	other?: InputProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) =>
	createFormItem(
		label,
		key,
		'input',
		{ type: 'textarea', placeholder: hookT('placeholder', label), ...other },
		itemAttrs,
		slot,
	)

/**
 * 创建一个表单密码输入项
 * @param {string} label 标签文本
 * @param {string} key 表单字段名
 * @param {InputProps & { class?: string }} other 输入框的额外属性
 * @param {FormItemProps & { class?: string }} itemAttrs 表单项的额外属性
 * @param {Object} slot 插槽配置
 * @returns {FormItemConfig} 表单项配置
 */
const useFormPassword = (
	label: string,
	key: string,
	other?: InputProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) =>
	createFormItem(
		label,
		key,
		'input',
		{ type: 'password', placeholder: hookT('placeholder', label), ...other },
		itemAttrs,
		slot,
	)

/**
 * 创建一个表单数字输入项
 * @param {string} label 标签文本
 * @param {string} key 表单字段名
 * @param {InputNumberProps & { class?: string }} other 输入框的额外属性
 * @param {FormItemProps & { class?: string }} itemAttrs 表单项的额外属性
 * @param {Object} slot 插槽配置
 * @returns {FormItemConfig} 表单项配置
 */
const useFormInputNumber = (
	label: string,
	key: string,
	other?: InputNumberProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => createFormItem(label, key, 'inputNumber', { showButton: false, ...other }, itemAttrs, slot)

/**
 * 定义嵌套值获取函数用于控制台日志
 * @param {Record<string, any>} obj 对象
 * @param {string} path 路径
 * @returns {any} 嵌套对象的值
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
	return path.includes('.')
		? path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj)
		: obj[path]
}

/**
 * 设置嵌套对象的值
 * @param obj 对象
 * @param path 路径
 * @param value 要设置的值
 */
const setNestedValue = (obj: Record<string, any>, path: string, value: any): void => {
	if (path.includes('.')) {
		const parts = path.split('.')
		const lastPart = parts.pop()!
		const target = parts.reduce((prev, curr) => {
			if (prev[curr] === undefined) {
				prev[curr] = {}
			}
			return prev[curr]
		}, obj)
		target[lastPart] = value
	} else {
		obj[path] = value
	}
}

/**
 * 创建一个表单组
 * @param group 表单项组
 */
const useFormGroup = <T extends Record<string, any>>(group: Record<string, any>[]) => {
	return {
		type: 'custom',
		render: (formData: Ref<T>, formRef: Ref<FormInst | null>) => {
			return (
				<div class="flex">
					{group.map((item) => {
						if (item.type === 'custom') return item.render(formData, formRef)
						const { children, ...itemProps } = item
						return (
							<NFormItem {...itemProps}>
								{children.map((child: BaseFormElement | RenderFormElement | SlotFormElement) => {
									if (child.type === 'render' || child.type === 'custom')
										return (child as RenderFormElement).render(formData, formRef)
									let type = child.type
									if (['textarea', 'password'].includes(child.type)) type = 'input'
									// 获取对应的 Naive UI 组件
									const Component = componentMap[type as keyof typeof componentMap]
									if (!Component) return null
									// 解构出组件属性，分离类型和字段名
									const { field, ...componentProps } = child as BaseFormElement
									return (
										<Component
											value={getNestedValue(formData.value as T, field)}
											onUpdateValue={(val: any) => {
												setNestedValue(formData.value as T, field, val)
											}}
											{...componentProps}
										/>
									)
								})}
							</NFormItem>
						)
					})}
				</div>
			)
		},
	}
}

/**
 * 创建一个表单选择器
 * @param label 标签文本
 * @param key 表单字段名
 * @param other 选择器的额外属性
 * @param itemAttrs 表单项的额外属性
 */
const useFormSelect = (
	label: string,
	key: string,
	options: SelectOption[],
	other?: SelectProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => {
	return createFormItem(label, key, 'select', { options, ...other }, itemAttrs, slot)
}

/**
 * 创建一个表单插槽
 * @param label 标签文本
 * @param key 表单字段名
 */
const useFormSlot = (key?: string) => {
	return {
		type: 'slot',
		slot: key || 'default',
	}
}

/**
 * 创建一个表单自定义渲染
 * @param render 自定义渲染函数
 */
const useFormCustom = <T,>(render: (formData: Ref<T>, formRef: Ref<FormInst | null>) => JSX.Element) => {
	return {
		type: 'custom' as const,
		render,
	}
}

/**
 * 创建一个表单单选框
 * @param label 标签文本
 * @param key 表单字段名
 */
const useFormRadio = (
	label: string,
	key: string,
	options: RadioOptionItem[],
	other?: RadioProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => {
	return createFormItem(label, key, 'radio', { options, ...other }, itemAttrs, slot)
}

/**
 * 创建一个表单单选按钮
 * @param label 标签文本
 * @param key 表单字段名
 */
const useFormRadioButton = (
	label: string,
	key: string,
	options: RadioOptionItem[],
	other?: RadioButtonProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => {
	return createFormItem(label, key, 'radioButton', { options, ...other }, itemAttrs, slot)
}
/**
 * 创建一个表单复选框
 * @param label 标签文本
 * @param key 表单字段名
 */
const useFormCheckbox = (
	label: string,
	key: string,
	options: CheckboxOptionItem[],
	other?: Partial<CheckboxGroupProps> & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => {
	return createFormItem(label, key, 'checkbox', { options, ...other } as any, itemAttrs, slot)
}

/**
 * 创建一个表单开关
 * @param label 标签文本
 * @param key 表单字段名
 */
const useFormSwitch = (
	label: string,
	key: string,
	other?: SwitchProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: SwitchSlots,
) => {
	return createFormItem(label, key, 'switch', { ...other }, itemAttrs, slot)
}

/**
 * 创建一个表单日期选择器
 * @param label 标签文本
 * @param key 表单字段名
 */
const useFormDatepicker = (
	label: string,
	key: string,
	other?: DatePickerProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => {
	return createFormItem(label, key, 'datepicker', { ...other }, itemAttrs, slot)
}

/**
 * 创建一个表单时间选择器
 * @param label 标签文本
 * @param key 表单字段名
 */
const useFormTimepicker = (
	label: string,
	key: string,
	other?: TimePickerProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => {
	return createFormItem(label, key, 'timepicker', { ...other }, itemAttrs, slot)
}

/**
 * 创建一个表单滑块
 * @param label 标签文本
 * @param key 表单字段名
 */
const useFormSlider = (
	label: string,
	key: string,
	other?: SliderProps & { class?: string },
	itemAttrs?: FormItemProps & { class?: string },
	slot?: { prefix?: Array<() => JSX.Element>; suffix?: Array<() => JSX.Element> },
) => {
	return createFormItem(label, key, 'slider', { ...other }, itemAttrs, slot)
}

/**
 * @description 表单行hook 更多配置
 * @param { Ref<boolean> } isMore 是否展开
 * @param { string } content 内容
 */
const useFormMore = (isMore: Ref<boolean>, content?: string) => {
	const color = `var(--n-color-target)`
	return {
		type: 'custom',
		render: () => (
			<NDivider
				class="cursor-pointer w-full"
				onClick={() => {
					isMore.value = !isMore.value
				}}
			>
				<div class="flex items-center w-full" style={{ color }}>
					<span class="mr-[4px]">
						{!isMore.value ? hookT('expand') : hookT('collapse')}
						{content || hookT('moreConfig')}
					</span>
					<NIcon>{isMore.value ? <DownOutlined /> : <LeftOutlined />}</NIcon>
				</div>
			</NDivider>
		),
	}
}

/**
 * @description 表单行hook 帮助文档
 * @param { Ref<boolean> } isMore 是否展开
 * @param { string } content 内容
 */
const useFormHelp = (
	options: { content: string | JSX.Element; isHtml?: boolean }[],
	other?: { listStyle?: string },
) => {
	const helpList = toRef(options)
	return {
		type: 'custom',
		render: () => (
			<ul
				class={`mt-[2px] leading-[2rem] text-[1.4rem] list-${other?.listStyle || 'disc'}`}
				style="color: var(--n-close-icon-color);margin-left: 1.6rem; line-height:2.2rem;"
				{...other}
			>
				{helpList.value.map(
					(
						item: {
							content: string | JSX.Element
							isHtml?: boolean
						},
						index: number,
					) => (item.isHtml ? <li key={index} v-html={item.content}></li> : <li key={index}>{item.content}</li>),
				)}
			</ul>
		),
	}
}

// 导出所有表单钩子函数
export const useFormHooks = () => ({
	useFormInput,
	useFormTextarea,
	useFormPassword,
	useFormInputNumber,
	useFormSelect,
	useFormSlot,
	useFormCustom,
	useFormGroup,
	useFormRadio,
	useFormRadioButton,
	useFormCheckbox,
	useFormSwitch,
	useFormDatepicker,
	useFormTimepicker,
	useFormSlider,
	useFormMore,
	useFormHelp,
})
