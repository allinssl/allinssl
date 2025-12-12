import { ref, createVNode, render, type VNode } from 'vue'
import { NSpin } from 'naive-ui'
import { LoadingMaskOptions, LoadingMaskInstance } from '../types/loadingMask'

/**
 * 默认配置选项
 */
const defaultOptions: LoadingMaskOptions = {
	text: '正在加载中，请稍后 ...',
	description: '',
	color: '',
	size: 'small',
	stroke: '',
	show: true,
	fullscreen: true,
	background: 'rgba(0, 0, 0, 0.5)',
	zIndex: 2000,
}

/**
 * 加载遮罩钩子函数
 * @param options 遮罩层初始配置
 * @returns LoadingMaskInstance 遮罩层控制实例
 */
const useLoadingMask = (options: LoadingMaskOptions = {}): LoadingMaskInstance => {
	// 合并配置
	const mergedOptions = ref<LoadingMaskOptions>({
		...defaultOptions,
		...options,
	})

	// 控制显示状态
	const visible = ref(false)
	// VNode实例
	let loadingInstance: VNode | null = null
	// 挂载容器
	let container: HTMLElement | null = null

	/**
	 * 创建遮罩层DOM元素
	 * 负责创建和配置遮罩层的容器元素
	 */
	const createLoadingElement = () => {
		// 如果已经存在，先销毁
		if (container) {
			document.body.removeChild(container)
			container = null
		}
		container = document.createElement('div')
		const targetElement = getTargetElement()

		// 设置样式
		const style: Record<string, unknown> = {
			position: mergedOptions.value.fullscreen ? 'fixed' : 'absolute',
			top: 0,
			left: 0,
			width: '100%',
			height: '100%',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: mergedOptions.value.background,
			zIndex: mergedOptions.value.zIndex,
			...(mergedOptions.value.customStyle || {}),
		}

		// 非全屏模式下，计算目标元素的位置和尺寸
		if (!mergedOptions.value.fullscreen && targetElement && targetElement !== document.body) {
			const rect = targetElement.getBoundingClientRect()
			Object.assign(style, {
				top: `${rect.top}px`,
				left: `${rect.left}px`,
				width: `${rect.width}px`,
				height: `${rect.height}px`,
				position: 'fixed',
			})
		}

		// 应用样式
		Object.keys(style).forEach((key) => {
			container!.style[key as any] = style[key] as string
		})

		// 添加自定义类名
		if (mergedOptions.value.customClass) {
			container.className = mergedOptions.value.customClass
		}
		document.body.appendChild(container)
		return container
	}

	/**
	 * 获取目标元素
	 * 根据配置返回目标DOM元素，如果没有指定或找不到则返回body
	 */
	const getTargetElement = (): HTMLElement => {
		const { target } = mergedOptions.value
		if (!target) {
			return document.body
		}
		if (typeof target === 'string') {
			const element = document.querySelector(target) as HTMLElement
			return element || document.body
		}
		return target
	}

	/**
	 * 渲染遮罩层
	 * 创建NSpin组件并渲染到容器中
	 */
	const renderLoading = () => {
		if (!visible.value) return
		const container = createLoadingElement()
		// 创建内容容器
		const contentContainer = createVNode(
			'div',
			{
				style: {
					display: 'flex',
					alignItems: 'center',
					padding: '16px 24px',
					backgroundColor: '#fff',
					borderRadius: '8px',
					boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
				},
			},
			[
				// 加载组件VNode
				createVNode(NSpin, {
					description: mergedOptions.value.description,
					size: mergedOptions.value.size,
					stroke: mergedOptions.value.stroke,
					style: { marginRight: '12px' },
					...(mergedOptions.value.spinProps || {}),
				}),
				// 文字内容
				createVNode(
					'span',
					{
						style: {
							fontSize: '14px',
							color: '#333',
						},
					},
					mergedOptions.value.text,
				),
			],
		)

		loadingInstance = contentContainer

		// 渲染到容器
		render(loadingInstance, container)
	}

	/**
	 * 打开遮罩层
	 * @param newOptions 可选的新配置，会与现有配置合并
	 */
	const open = (newOptions?: LoadingMaskOptions) => {
		if (newOptions) {
			mergedOptions.value = {
				...mergedOptions.value,
				...newOptions,
			}
		}

		visible.value = true
		renderLoading()
	}

	/**
	 * 关闭遮罩层
	 * 隐藏并移除DOM元素，同时调用onClose回调
	 */
	const close = () => {
		console.log('close', '测试内容')
		visible.value = false

		if (container) {
			render(null, container)
			document.body.removeChild(container)
			container = null
		}

		mergedOptions.value.onClose?.()
	}

	/**
	 * 更新遮罩层配置
	 * @param newOptions 新的配置选项
	 */
	const update = (newOptions: LoadingMaskOptions) => {
		mergedOptions.value = {
			...mergedOptions.value,
			...newOptions,
		}

		if (visible.value) {
			renderLoading()
		}
	}

	/**
	 * 销毁遮罩层实例
	 * 关闭并清理资源
	 */
	const destroy = () => {
		close()
		loadingInstance = null
	}

	return {
		open,
		close,
		update,
		destroy,
	}
}

export default useLoadingMask
