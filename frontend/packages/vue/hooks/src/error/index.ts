/**
 * 错误处理 Hook
 *
 * @example
 * ```typescript
 * // 基础使用
 * const { handleError } = useError()
 *
 * // 处理运行时错误
 * try {
 *   throw new Error('运行时错误')
 * } catch (error) {
 *   handleError(error)
 * }
 *
 * // 处理网络错误（自动显示弹窗）
 * try {
 *   await fetch('invalid-url')
 * } catch (error) {
 *   handleError(error, {
 *     title: '网络错误',
 *     content: '请检查网络连接',
 *     showCancel: true
 *   })
 * }
 *
 * // 处理业务错误
 * const businessError = {
 *   code: 'E001',
 *   message: '余额不足'
 * }
 * handleError(businessError)
 *
 * // 高级配置
 * const { handleError, collector } = useError({
 *   showMessage: true,      // 显示错误消息
 *   showDialog: true,       // 显示错误弹窗
 *   reportError: true,      // 启用错误上报
 *   autoAnalyze: true,      // 自动分析错误
 *   reportHandler: (errors) => {
 *     // 自定义错误上报逻辑
 *     console.log('上报错误:', errors)
 *   },
 *   customHandler: (error) => {
 *     // 自定义错误处理逻辑
 *     console.error('自定义处理:', error)
 *   }
 * })
 *
 * // 错误收集和上报
 * collector.collect({
 *   message: '收集错误',
 *   type: 'business'
 * })
 *
 * // 上报所有错误
 * collector.report()
 *
 * // 清空错误队列
 * collector.clear()
 * ```
 */

import { useMessage } from '@baota/naive-ui/hooks'
import { ref } from 'vue'
import type { ErrorInfo, ErrorHandlerOptions, ErrorCollector, ErrorAnalysis, ErrorDialogConfig } from './type'
import { AxiosError } from 'axios'
import { isArray } from '@baota/utils/type'

/** 错误队列 */
const errorQueue = ref<ErrorInfo[]>([])

/** 默认错误处理选项 */
const DEFAULT_OPTIONS: ErrorHandlerOptions = {
	showMessage: true, // 显示错误消息
	reportError: true, // 启用错误上报
	autoAnalyze: true, // 自动分析错误
	showDialog: false, // 显示错误弹窗
}

/**
 * 默认错误弹窗配置
 */
const DEFAULT_DIALOG_CONFIG: ErrorDialogConfig = {
	title: '错误提示',
	confirmText: '确定',
	cancelText: '取消',
	showCancel: false,
}

/**
 * 分析错误类型和级别
 * @param error 错误对象
 * @returns 错误分析结果
 */
const analyzeErrorType = (error: Error | unknown): ErrorAnalysis => {
	// 如果是 AxiosError，则直接返回错误消息
	if ((error as AxiosError).name === 'AxiosError') {
		return {
			type: 'network',
			level: 'error',
			summary: (error as AxiosError).message,
			details: { message: (error as AxiosError).message },
		}
	}

	// 网络错误
	if (error instanceof TypeError && error.message.includes('network')) {
		return {
			type: 'network',
			level: 'error',
			summary: '网络请求错误',
			details: { message: error.message },
		}
	}

	// 运行时错误
	if (error instanceof Error) {
		return {
			type: 'runtime',
			level: 'error',
			summary: error.message,
			details: {
				stack: error.stack,
				name: error.name,
			},
		}
	}

	// 业务错误
	if (typeof error === 'object' && error !== null && 'code' in error) {
		return {
			type: 'business',
			level: 'warning',
			summary: '业务处理错误，请联系管理员',
			details: error,
		}
	}

	// 验证错误
	if (typeof error === 'object' && error !== null && Array.isArray(error)) {
		return {
			type: 'validation',
			level: 'warning',
			summary: '数据验证错误',
			details: { message: '数据验证错误，请检查输入内容' },
		}
	}

	if (typeof error === 'string') {
		return {
			type: 'runtime',
			level: 'error',
			summary: error,
			details: { message: error },
		}
	}
	// 未知错误
	return {
		type: 'runtime',
		level: 'error',
		summary: '未知错误',
		details: { message: error?.message || '未知错误' },
	}
}

/**
 * 显示错误弹窗
 * @param error 错误信息
 * @param config 弹窗配置
 */
const showErrorDialog = (error: ErrorInfo, config: ErrorDialogConfig = {}) => {
	const dialogConfig = { ...DEFAULT_DIALOG_CONFIG, ...config }
	// TODO: 实现错误弹窗显示逻辑
	console.log('Show error dialog:', error, dialogConfig)
}

/**
 * 错误处理 Hook
 * @param options 错误处理选项
 * @returns 错误处理函数和收集器
 */
export const useError = (options: ErrorHandlerOptions = {}) => {
	const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

	// 判断是否为 ErrorInfo
	const isErrorInfo = (error: unknown): error is ErrorInfo =>
		typeof error === 'object' && error !== null && 'message' in error

	// 默认错误处理函数
	const defaultFn = (error: ErrorInfo | Error | AxiosError | unknown, msg: string) =>
		typeof error !== 'boolean' && isErrorInfo(error) ? error.message : msg

	/**
	 * 处理错误
	 * @param error 错误信息或原始错误对象
	 * @param dialogConfig 弹窗配置（可选）
	 * @returns 处理后的错误信息
	 */
	const handleError = (error: ErrorInfo | Error | AxiosError | unknown | string, dialogConfig?: ErrorDialogConfig) => {
		const message = useMessage()

		let errorInfo: ErrorInfo

		// 如果传入的错误为布尔值，则直接返回
		if (typeof error === 'boolean') return { default: (msg: string) => defaultFn(error, msg) }

		// 如果启用了自动分析，且传入的是原始错误对象
		if (mergedOptions.autoAnalyze && typeof error === 'object' && error !== null && 'message' in error) {
			errorInfo = collector.analyze(error)
		} else {
			errorInfo = error as ErrorInfo
		}
		// 添加时间戳
		errorInfo.timestamp = Date.now()

		// 收集错误
		errorQueue.value.push(errorInfo)

		// 根据错误级别显示不同类型的消息
		if (mergedOptions.showMessage) {
			// 如果是 ErrorInfo，则根据错误级别显示不同类型的消息
			const analysis = analyzeErrorType(error)
			console.log('handleError', typeof error, analysis)

			switch (analysis.level) {
				case 'error':
					message.error(analysis.details.message || analysis.summary)
					break
				case 'warning':
					message.warning(analysis.details.message || analysis.summary)
					break
				case 'info':
					message.info(errorInfo.message || analysis.summary)
					break
			}
		}

		// 显示错误弹窗
		if (mergedOptions.showDialog) {
			showErrorDialog(errorInfo, dialogConfig)
		}

		// 自定义处理
		if (mergedOptions.customHandler) {
			mergedOptions.customHandler(errorInfo)
		}

		return { errorInfo, ...message, default: (msg: string) => defaultFn(error, msg) }
	}

	/**
	 * 错误收集器
	 */
	const collector: ErrorCollector = {
		/**
		 * 收集错误
		 * @param error 错误信息
		 */
		collect: (error: ErrorInfo) => {
			errorQueue.value.push({
				...error,
				timestamp: Date.now(),
			})
		},

		/**
		 * 上报错误
		 * @param errors 错误列表
		 */
		report: (errors: ErrorInfo[] = errorQueue.value) => {
			if (mergedOptions.reportError) {
				if (mergedOptions.reportHandler) {
					mergedOptions.reportHandler(errors)
				} else {
					// 默认上报逻辑
					console.log('Reporting errors:', errors)
				}
			}
		},

		/**
		 * 清空错误队列
		 */
		clear: () => {
			errorQueue.value = []
		},

		/**
		 * 分析错误
		 * @param error 错误对象
		 * @returns 标准化的错误信息
		 */
		analyze: (error: Error | unknown): ErrorInfo => {
			const analysis = analyzeErrorType(error)
			return {
				message: analysis.summary,
				type: analysis.type,
				metadata: analysis.details,
				timestamp: Date.now(),
			}
		},
	}

	return {
		handleError,
		collector,
		errorQueue,
	}
}
