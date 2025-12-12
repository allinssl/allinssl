/**
 * 错误信息接口
 */
export interface ErrorInfo {
	/** 错误消息 */
	message: string
	/** 错误代码 */
	code?: string | number
	/** 错误堆栈 */
	stack?: string
	/** 错误类型 */
	type?: ErrorType
	/** 时间戳 */
	timestamp?: number
	/** 元数据 */
	metadata?: Record<string, any>
}

/**
 * 错误类型
 */
export type ErrorType = 'runtime' | 'network' | 'business' | 'validation'

/**
 * 错误级别
 */
export type ErrorLevel = 'error' | 'warning' | 'info'

/**
 * 错误分析结果
 */
export interface ErrorAnalysis {
	/** 错误类型 */
	type: ErrorType
	/** 错误级别 */
	level: ErrorLevel
	/** 错误摘要 */
	summary: string
	/** 详细信息 */
	details: Record<string, any>
}

/**
 * 错误处理选项
 */
export interface ErrorHandlerOptions {
	/** 是否显示错误消息 */
	showMessage?: boolean
	/** 是否上报错误 */
	reportError?: boolean
	/** 是否自动分析错误 */
	autoAnalyze?: boolean
	/** 自定义错误处理函数 */
	customHandler?: (error: ErrorInfo) => void
	/** 错误上报函数 */
	reportHandler?: (errors: ErrorInfo[]) => void
	/** 是否显示错误弹窗 */
	showDialog?: boolean
}

/**
 * 错误收集器接口
 */
export interface ErrorCollector {
	/** 收集错误 */
	collect: (error: ErrorInfo) => void
	/** 上报错误 */
	report: (errors: ErrorInfo[]) => void
	/** 清空错误队列 */
	clear: () => void
	/** 分析错误 */
	analyze: (error: Error | unknown) => ErrorInfo
}

/**
 * 错误弹窗配置
 */
export interface ErrorDialogConfig {
	/** 标题 */
	title?: string
	/** 内容 */
	content?: string
	/** 确认按钮文本 */
	confirmText?: string
	/** 取消按钮文本 */
	cancelText?: string
	/** 是否显示取消按钮 */
	showCancel?: boolean
}
