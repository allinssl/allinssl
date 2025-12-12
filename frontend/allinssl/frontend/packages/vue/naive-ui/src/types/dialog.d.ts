import type { DialogOptions } from 'naive-ui'

// 自定义Dialog配置类型
export interface CustomDialogOptions extends Omit<DialogOptions, 'type'> {
	type?: 'info' | 'success' | 'warning' | 'error' // 类型
	area?: string | [string, string]
	title?: string | (() => VNodeChild) // 标题
	content?: string | (() => VNodeChild) // 内容
	confirmText?: string // 确认按钮文本
	cancelText?: string // 取消按钮文本
	confirmButtonProps?: ButtonProps // 确认按钮props
	cancelButtonProps?: ButtonProps // 取消按钮props
	onConfirm?: () => Promise<boolean | void> | void // 确认回调
	onCancel?: () => Promise<boolean | void> | void // 取消回调
	onClose?: () => void // 关闭回调
	onMaskClick?: () => void // 遮罩点击回调
}
