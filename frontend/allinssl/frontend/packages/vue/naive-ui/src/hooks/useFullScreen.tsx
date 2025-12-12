import { h, ref, Ref, defineComponent, onBeforeUnmount } from 'vue'
import { NButton } from 'naive-ui'

/**
 * 扩展Document接口以支持各浏览器的全屏API
 * 处理不同浏览器前缀版本的全屏元素获取和退出全屏方法
 */
interface FullscreenDocument extends Document {
	webkitFullscreenElement?: Element // Webkit浏览器的全屏元素属性
	mozFullScreenElement?: Element // Mozilla浏览器的全屏元素属性
	msFullscreenElement?: Element // IE浏览器的全屏元素属性
	webkitExitFullscreen?: () => Promise<void> // Webkit浏览器退出全屏方法
	mozCancelFullScreen?: () => Promise<void> // Mozilla浏览器退出全屏方法
	msExitFullscreen?: () => Promise<void> // IE浏览器退出全屏方法
}

/**
 * 扩展HTMLElement接口以支持各浏览器的全屏请求方法
 * 处理不同浏览器前缀版本的请求全屏方法
 */
interface FullscreenElement extends HTMLElement {
	webkitRequestFullscreen?: () => Promise<void> // Webkit浏览器请求全屏方法
	mozRequestFullScreen?: () => Promise<void> // Mozilla浏览器请求全屏方法
	msRequestFullscreen?: () => Promise<void> // IE浏览器请求全屏方法
}

/**
 * 全屏钩子配置选项接口
 */
interface UseFullScreenOptions {
	onEnter?: () => void // 进入全屏时的回调函数
	onExit?: () => void // 退出全屏时的回调函数
}

/**
 * 全屏钩子返回值接口
 */
interface UseFullScreenReturn {
	isFullscreen: Ref<boolean> // 是否处于全屏状态
	toggle: () => void // 切换全屏状态的方法
	FullScreenButton: ReturnType<typeof defineComponent> // 全屏切换按钮组件
}

/**
 * 全屏功能钩子函数
 * 提供全屏状态管理、切换控制和内置全屏按钮组件
 *
 * @param targetRef - 目标元素引用，可以是HTMLElement或包含$el属性的Vue组件实例
 * @param options - 配置选项，包含进入和退出全屏的回调函数
 * @returns 包含全屏状态、切换方法和按钮组件的对象
 */
export default function useFullScreen(
	targetRef: Ref<HTMLElement | null | { $el: HTMLElement }>,
	options: UseFullScreenOptions = {},
): UseFullScreenReturn {
	const isFullscreen = ref(false) // 全屏状态引用
	const fullscreenDoc = document as FullscreenDocument

	/**
	 * 获取当前处于全屏状态的元素
	 * 兼容不同浏览器的全屏API
	 * @returns 全屏元素或null
	 */
	const getFullscreenElement = (): Element | null => {
		return (
			fullscreenDoc.fullscreenElement ||
			fullscreenDoc.webkitFullscreenElement ||
			fullscreenDoc.mozFullScreenElement ||
			fullscreenDoc.msFullscreenElement ||
			null
		)
	}

	/**
	 * 进入全屏模式
	 * 尝试使用不同浏览器支持的方法请求全屏
	 */
	const enterFullscreen = async (): Promise<void> => {
		// 处理Vue组件实例和普通DOM元素两种情况
		const target = targetRef.value && '$el' in targetRef.value ? targetRef.value.$el : targetRef.value
		if (!target) return

		try {
			const element = target as FullscreenElement
			const requestMethods = [
				element.requestFullscreen,
				element.webkitRequestFullscreen,
				element.mozRequestFullScreen,
				element.msRequestFullscreen,
			]

			// 找到并使用第一个可用的方法
			for (const method of requestMethods) {
				if (method) {
					await method.call(element)
					break
				}
			}

			isFullscreen.value = true
			// 调用进入全屏回调（如果提供）
			options.onEnter?.()
		} catch (error) {
			console.error('Failed to enter fullscreen:', error)
		}
	}

	/**
	 * 退出全屏模式
	 * 尝试使用不同浏览器支持的方法退出全屏
	 */
	const exitFullscreen = async (): Promise<void> => {
		try {
			const exitMethods = [
				fullscreenDoc.exitFullscreen,
				fullscreenDoc.webkitExitFullscreen,
				fullscreenDoc.mozCancelFullScreen,
				fullscreenDoc.msExitFullscreen,
			]

			// 找到并使用第一个可用的方法
			for (const method of exitMethods) {
				if (method) {
					await method.call(document)
					break
				}
			}

			isFullscreen.value = false
			// 调用退出全屏回调（如果提供）
			options.onExit?.()
		} catch (error) {
			console.error('Failed to exit fullscreen:', error)
		}
	}

	/**
	 * 切换全屏状态
	 * 根据当前状态决定是进入还是退出全屏
	 */
	const toggle = (): void => {
		if (isFullscreen.value) {
			exitFullscreen()
		} else {
			enterFullscreen()
		}
	}

	/**
	 * 处理全屏状态变化事件
	 * 在全屏状态变化时更新状态并调用回调
	 */
	const handleFullscreenChange = (): void => {
		isFullscreen.value = !!getFullscreenElement()
		// 当退出全屏时调用退出回调
		if (!isFullscreen.value) {
			options.onExit?.()
		}
	}

	// 支持不同浏览器的全屏变化事件名称
	const fullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']

	// 为所有全屏事件添加监听器
	fullscreenEvents.forEach((event) => {
		document.addEventListener(event, handleFullscreenChange)
	})

	// 组件卸载前清理：移除所有事件监听器
	onBeforeUnmount(() => {
		fullscreenEvents.forEach((event) => {
			document.removeEventListener(event, handleFullscreenChange)
		})
	})

	/**
	 * 全屏切换按钮组件
	 * 提供一个内置的UI组件用于切换全屏状态
	 */
	const FullScreenButton = defineComponent({
		name: 'FullScreenButton',
		setup() {
			return () =>
				h(
					NButton,
					{
						onClick: toggle,
						type: 'primary',
						ghost: true,
					},
					// 根据全屏状态显示不同的按钮文本
					() => (isFullscreen.value ? '退出全屏' : '进入全屏'),
				)
		},
	})

	// 返回钩子的公开API
	return {
		isFullscreen,
		toggle,
		FullScreenButton,
	}
}
