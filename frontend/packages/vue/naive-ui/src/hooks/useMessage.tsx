import { computed, getCurrentInstance } from 'vue'
import { useMessage as useNaiveMessage, createDiscreteApi, type MessageOptions } from 'naive-ui'
import { useTheme } from '../theme'
import type { MessageApiExtended } from '../types/message'

/**
 * 消息提示钩子函数，兼容组件内和非组件环境
 *
 * 在组件中使用时，使用 Naive UI 的 useMessage
 * 在非组件环境中，使用 createDiscreteApi 创建消息实例
 */
export function useMessage(): MessageApiExtended {
	// 判断是否在setup中使用
	const instance = getCurrentInstance()

	// 在setup中使用原生useMessage
	if (instance && instance?.setupContext) {
		const naiveMessage = useNaiveMessage()
		return {
			...naiveMessage,
			request: (data: { status: boolean; message: string }, options?: MessageOptions) => {
				if (data.status) {
					return naiveMessage.success(data.message, options)
				} else {
					return naiveMessage.error(data.message, options)
				}
			},
		}
	}

	// 在非组件环境中使用createDiscreteApi
	const { theme, themeOverrides } = useTheme()

	// 创建configProviderProps
	const configProviderProps = computed(() => ({
		theme: theme.value,
		themeOverrides: themeOverrides.value,
	}))

	// 创建discreteMessage实例
	const { message, unmount } = createDiscreteApi(['message'], { configProviderProps })

	// 创建包装函数，添加unmount到onAfterLeave
	const wrapMethod =
		(method: any) =>
		(content: string, options: MessageOptions = {}) => {
			const newOptions = {
				...options,
				onAfterLeave: () => {
					options.onAfterLeave?.()
					unmount()
				},
			}
			return method(content, newOptions)
		}

	// 包装所有消息方法
	const wrappedMessage = {
		...message,
		info: wrapMethod(message.info),
		success: wrapMethod(message.success),
		warning: wrapMethod(message.warning),
		error: wrapMethod(message.error),
		loading: wrapMethod(message.loading),
		request: (data: { status: boolean; message: string }, options: MessageOptions = {}) => {
			const newOptions = {
				...options,
				onAfterLeave: () => {
					options.onAfterLeave?.()
					unmount()
				},
			}

			if (data.status) {
				return wrapMethod(message.success)(data.message, newOptions)
			} else {
				return wrapMethod(message.error)(data.message, newOptions)
			}
		},
	} as MessageApiExtended

	return wrappedMessage
}

export default useMessage
