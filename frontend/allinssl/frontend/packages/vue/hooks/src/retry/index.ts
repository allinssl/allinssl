import { ref } from 'vue'

export interface RetryOptions {
	retries?: number // 重试次数
	delay?: number // 重试延迟，单位毫秒，默认为1000ms
}

// 等待函数，用于暂停指定的毫秒数
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * @description 重试hook，用于尝试执行异步操作并提供重试逻辑
 * @param {() => Promise<T>} fn 待执行的异步函数
 * @param {RetryOptions} options 配置重试策略
 * @returns { run, loading, error } 包含执行函数、加载状态和错误信息
 */
export default function useRetry<T>(fn: () => Promise<T>, options?: RetryOptions) {
	const { retries = 3, delay = 1000 } = options || {}
	const loading = ref(false)
	const error = ref<Error | null>(null)

	// run方法封装了重试逻辑
	const run = async () => {
		loading.value = true // 标记开始执行
		error.value = null // 清除之前的错误状态
		let attempt = 0
		let lastError: Error | null = null
		// 循环尝试执行异步函数
		while (attempt < retries) {
			try {
				// 尝试调用传入的异步函数
				const result = await fn()
				loading.value = false // 成功后取消加载状态
				return result
			} catch (err: any) {
				lastError = err
				error.value = err // 记录错误
				attempt++
				// 若未达到最大重试次数，则等待后重试
				if (attempt < retries) {
					await sleep(delay)
				}
			}
		}
		loading.value = false // 重试完毕后取消加载状态
		throw lastError || new Error('重试失败')
	}

	return { run, loading, error }
}
