import {
	type Component,
	type VNodeChild,
	ref,
	h,
	getCurrentInstance,
	provide,
	defineComponent,
	inject,
	App,
	Ref,
	computed,
	ComputedRef,
} from 'vue'
import {
	useModal as useNaiveModal,
	createDiscreteApi,
	type ButtonProps,
	type ModalReactive,
	NButton,
	ModalOptions,
} from 'naive-ui'
import { isBoolean } from '@baota/utils/type'
import { useTheme } from '../theme'
import { translation } from '../locals/translation'

import customProvider from '../components/customProvider'

// 定义provide/inject的key
export const MODAL_CLOSE_KEY = Symbol('modal-close')
export const MODAL_CLOSEABLE_KEY = Symbol('modal-closeable')
export const MODAL_LOADING_KEY = Symbol('modal-loading')
export const MODAL_CONFIRM_KEY = Symbol('modal-confirm')
export const MODAL_CANCEL_KEY = Symbol('modal-cancel')
// export const MODAL_I18N_KEY = Symbol('modal-i18n')e')
export const MODAL_MESSAGE_KEY = Symbol('modal-message')
export const MODAL_OPTIONS_KEY = Symbol('modal-options')
// 自定义Modal配置类型
export interface CustomModalOptions {
	title?: string | (() => VNodeChild) // 标题
	area?: string | string[] | number | number[] // 视图大小
	maskClosable?: boolean // 是否可通过遮罩层关闭
	destroyOnClose?: boolean // 是否在关闭时销毁
	draggable?: boolean // 是否可拖拽
	closable?: boolean // 是否显示关闭按钮
	footer?: boolean | (() => VNodeChild) // 是否显示底部按钮
	confirmText?: string | Ref<string> | ComputedRef<string> // 确认按钮文本
	cancelText?: string | Ref<string> | ComputedRef<string> // 取消按钮文本
	modalStyle?: Record<string, any> // 弹窗样式
	confirmButtonProps?: ButtonProps // 确认按钮props
	cancelButtonProps?: ButtonProps // 取消按钮props
	component?: (() => Promise<Component>) | Component // 组件
	componentProps?: Record<string, unknown> // 组件props
	onConfirm?: (close: () => void) => Promise<unknown> | void // 确认回调
	onCancel?: (close: () => void) => Promise<unknown> | void // 取消回调
	onClose?: (close: () => void) => void // 关闭回调
	onUpdateShow?: (show: boolean) => void // 更新显示状态回调
	modelOptions?: ModalOptions // Modal配置
	'z-index'?: number
}

const appsUseList = {
	router: null,
	i18n: null,
	pinia: null,
}

// 挂载资源
const mountApps = (app: App, resources: any) => {
	if (app && resources) app.use(resources)
}

// 自定义Modal钩子函数
const useModal = (options: CustomModalOptions) => {
	const { theme, themeOverrides } = useTheme()

	// 创建discreteModal实例 - 这个可以在任何地方使用
	const { modal, message, unmount, app } = createDiscreteApi(['modal', 'message'], {
		configProviderProps: { theme: theme.value, themeOverrides: themeOverrides.value },
	})

	mountApps(app, appsUseList['i18n'])
	mountApps(app, appsUseList['router'])
	mountApps(app, appsUseList['pinia'])

	// 判断是否在setup中使用
	const instance = getCurrentInstance()
	// 控制Modal显示状态
	const visible = ref(false)
	// Modal实例引用
	const modalInstance = ref<ModalReactive | null>(null)
	// 获取naiveModal实例 - 只在setup中使用
	const getNaiveModal = () => {
		if (instance) {
			return useNaiveModal()
		}
		return null
	}

	// const naiveModal = getNaiveModal()
	// 获取组件实例引用
	const wrapperRef = ref()
	// 创建Modal方法
	const create = async (optionsNew: CustomModalOptions) => {
		const {
			component,
			componentProps,
			onConfirm,
			onCancel,
			footer = false,
			confirmText,
			cancelText,
			confirmButtonProps = { type: 'primary' },
			cancelButtonProps = { type: 'default' },
			...modelOptions
		} = optionsNew

		const optionsRef = ref({ footer, confirmText, cancelText, confirmButtonProps, cancelButtonProps })

		// 处理视图高度和宽度
		const getViewSize = (areaNew: string | string[] | number | number[] = '50%') => {
			if (Array.isArray(areaNew)) {
				return {
					width: typeof areaNew[0] === 'number' ? areaNew[0] + 'px' : areaNew[0],
					height: typeof areaNew[1] === 'number' ? areaNew[1] + 'px' : areaNew[1],
				}
			}
			return {
				width: typeof areaNew === 'number' ? areaNew + 'px' : areaNew,
				height: 'auto',
			}
		}

		// 处理组件
		const content = async () => {
			if (typeof component === 'function') {
				try {
					// 处理异步组件函数
					const syncComponent = await (component as () => Promise<Component>)()
					return syncComponent.default || syncComponent
				} catch (e) {
					// 处理普通函数组件
					return component
				}
			}
			return component
		}

		// 组件
		const componentNew = (await content()) as Component
		// 视图大小
		const { width, height } = await getViewSize(optionsNew.area)

		// 存储组件内部注册的方法
		const confirmHandler = ref<(close: () => void) => Promise<void> | void>()
		const cancelHandler = ref<(close: () => void) => Promise<void> | void>()
		const closeable = ref(true)
		const loading = ref(false)

		// 获取当前语言
		const currentLocale = localStorage.getItem('activeLocales') || '"zhCN"'
		// 获取翻译文本
		const hookT = (key: string) => {
			const locale = currentLocale.replace('-', '_').replace(/"/g, '')
			return (
				translation[locale as keyof typeof translation]?.useModal?.[key as keyof typeof translation.zhCN.useModal] ||
				translation.zhCN.useModal[key as keyof typeof translation.zhCN.useModal]
			)
		}

		const closeMessage = ref(hookT('cannotClose'))

		// 合并Modal配置
		const config: ModalOptions = {
			preset: 'card',
			style: { width, height, ...modelOptions.modalStyle },
			closeOnEsc: false,
			maskClosable: false,
			onClose: () => {
				if (!closeable.value || loading.value) {
					message.error(closeMessage.value)
					return false
				}
				// 调用组件内注册的取消方法
				cancelHandler.value?.()
				// 调用外部传入的取消回调
				onCancel?.(() => {})
				unmount() // 卸载
				return true
			},
			content: () => {
				const Wrapper = defineComponent({
					setup() {
						// 提供Modal配置
						provide(MODAL_OPTIONS_KEY, optionsRef)

						// 提供关闭方法
						provide(MODAL_CLOSE_KEY, close)

						// 提供信息方法
						provide(MODAL_MESSAGE_KEY, message)

						// 模块-确认按钮
						provide(MODAL_CONFIRM_KEY, (handler: (close: () => void) => Promise<void> | void) => {
							confirmHandler.value = handler
						})

						// 模块-取消按钮
						provide(MODAL_CANCEL_KEY, (handler: (close: () => void) => Promise<void> | void) => {
							cancelHandler.value = handler
						})

						// 模块	- 可关闭状态
						provide(MODAL_CLOSEABLE_KEY, (canClose: boolean) => {
							closeable.value = canClose
						})

						// 模块-过度
						provide(MODAL_LOADING_KEY, (loadStatus: boolean, closeMsg?: string) => {
							loading.value = loadStatus
							closeMessage.value = closeMsg || hookT('cannotClose')
						})

						// 暴露给父级使用
						return {
							confirmHandler,
							cancelHandler,
							render: () => h(componentNew as Component, { ...componentProps }),
						}
					},
					render() {
						return this.render()
					},
				})

				const wrapper = instance ? h(Wrapper) : h(customProvider, {}, () => h(Wrapper))

				return h(wrapper, { ref: wrapperRef })
			},
			// onAfterLeave: () => {
			// 	// 调用组件内注册的取消方法
			// 	cancelHandler.value?.()
			// 	// 调用外部传入的取消回调
			// 	onCancel?.(() => {})
			// },
		}
		const footerComp = computed(() => {
			if (isBoolean(optionsRef.value.footer) && optionsRef.value.footer) {
				// 确认事件
				const confirmEvent = async () => {
					await confirmHandler.value?.(close)
					// 调用外部传入的确认回调
					await onConfirm?.(close)
				}
				// 取消事件
				const cancelEvent = async () => {
					await cancelHandler.value?.(close)
					// 调用外部传入的取消回调
					await onCancel?.(close)
					if (!cancelHandler.value && !onCancel) {
						close()
					}
				}
				return (
					<div class="flex justify-end">
						<NButton
							disabled={loading.value}
							{...cancelButtonProps}
							style={{ marginRight: '8px' }}
							onClick={cancelEvent}
						>
							{optionsRef.value.cancelText || hookT('cancel')}
						</NButton>
						<NButton disabled={loading.value} {...confirmButtonProps} onClick={confirmEvent}>
							{optionsRef.value.confirmText || hookT('confirm')}
						</NButton>
					</div>
				)
			}
			return null
		})
		// 底部按钮配置
		if (optionsRef.value.footer) config.footer = () => footerComp.value
		// 合并Modal配置
		Object.assign(config, modelOptions)
		if (instance) {
			const currentNaiveModal = getNaiveModal()
			if (currentNaiveModal) {
				modalInstance.value = currentNaiveModal.create(config)
				return modalInstance.value
			}
		}
		// 使用createDiscreteApi创建
		const discreteModal = modal.create(config)
		modalInstance.value = discreteModal
		options.onUpdateShow?.(true)
		return discreteModal
	}

	// 关闭Modal方法
	const close = () => {
		visible.value = false
		if (modalInstance.value) {
			modalInstance.value.destroy()
		}
		options.onUpdateShow?.(false)
	}

	// 销毁所有Modal实例方法
	const destroyAll = () => {
		// 销毁当前实例
		if (modalInstance.value) {
			modalInstance.value.destroy()
			modalInstance.value = null
		}
		visible.value = false
		// 销毁所有实例
		const currentNaiveModal = getNaiveModal()
		if (currentNaiveModal) {
			currentNaiveModal.destroyAll()
		} else {
			modal.destroyAll()
		}
	}

	// 更新显示状态
	const updateShow = (show: boolean) => {
		visible.value = show
	}

	return {
		...create(options),
		updateShow,
		close,
		destroyAll,
	}
}

/**
 * @description 重新设置Modal配置的钩子函数
 * @returns {Object} Modal配置
 */
export const useModalOptions = (): Ref<CustomModalOptions> => {
	return inject(MODAL_OPTIONS_KEY, ref({}))
}

/**
 * @description 获取Modal关闭方法的钩子函数
 */
export const useModalClose = () =>
	inject(MODAL_CLOSE_KEY, () => {
		console.warn('useModalClose 必须在 Modal 组件内部使用')
	})

/**
 * @description 注册Modal确认按钮点击处理方法的钩子函数
 * @param handler 确认按钮处理函数，接收一个关闭Modal的函数作为参数
 * @returns void
 */
export const useModalConfirm = (handler: (close: () => void) => Promise<any> | void) => {
	const registerConfirm = inject(MODAL_CONFIRM_KEY, (fn: (close: () => void) => Promise<void> | void) => {
		console.warn('useModalConfirm 必须在 Modal 组件内部使用')
		return
	})
	// 注册确认处理方法
	registerConfirm(handler)
}

/**
 * @description 注册Modal取消按钮点击处理方法的钩子函数
 * @param handler 取消按钮处理函数，接收一个关闭Modal的函数作为参数
 * @returns void
 */
export const useModalCancel = (handler: (close: () => void) => Promise<void> | void) => {
	const registerCancel = inject(MODAL_CANCEL_KEY, (fn: (close: () => void) => Promise<void> | void) => {
		console.warn('useModalCancel 必须在 Modal 组件内部使用')
		return
	})
	// 注册取消处理方法
	registerCancel(handler)
}

/**
 * @description 控制Modal是否可关闭的钩子函数
 * @returns {(canClose: boolean) => void} 设置Modal可关闭状态的函数
 */
export const useModalCloseable = () => {
	const registerCloseable = inject(MODAL_CLOSEABLE_KEY, (canClose: boolean) => {
		console.warn('useModalCloseable 必须在 Modal 组件内部使用')
		return
	})
	return registerCloseable
}

/**
 * @description 获取Modal消息提示实例的钩子函数
 * @returns {Object} Message消息实例，包含loading, success, error, warning, info等方法
 */
export const useModalMessage = () => {
	const message = inject(MODAL_MESSAGE_KEY, {
		loading: (str: string) => {},
		success: (str: string) => {},
		error: (str: string) => {},
		warning: (str: string) => {},
		info: (str: string) => {},
	})
	return message
}

/**
 * @description 控制Modal加载状态的钩子函数
 * @returns {(loadStatus: boolean, closeMsg?: string) => void} 设置加载状态的函数，
 * loadStatus为true时显示加载状态并禁止关闭，closeMsg为自定义禁止关闭时的提示消息
 */
export const useModalLoading = () => {
	const registerLoading = inject(MODAL_LOADING_KEY, (loadStatus: boolean, closeMsg?: string) => {
		console.warn('useModalLoading 必须在 Modal 组件内部使用')
		return
	})
	return registerLoading
}

/**
 * @description 获取Modal所有钩子函数的集合
 * @returns {Object} 包含所有Modal相关钩子函数的对象
 */
export const useModalHooks = () => ({
	/**
	 * 设置Modal配置，用于修改Modal的配置
	 */
	options: useModalOptions,

	/**
	 * 关闭当前Modal的函数
	 */
	close: useModalClose,

	/**
	 * 注册Modal确认按钮点击处理方法
	 */
	confirm: useModalConfirm,

	/**
	 * 注册Modal取消按钮点击处理方法
	 */
	cancel: useModalCancel,

	/**
	 * 设置Modal是否可关闭的状态控制函数
	 */
	closeable: useModalCloseable,

	/**
	 * 获取Modal内部可用的消息提示实例
	 */
	message: useModalMessage,

	/**
	 * 设置Modal加载状态的控制函数
	 */
	loading: useModalLoading,
})

// 设置资源
export const useModalUseDiscrete = ({ router, i18n, pinia }: any) => {
	appsUseList['i18n'] = i18n
	appsUseList['router'] = router
	appsUseList['pinia'] = pinia
}

export default useModal
