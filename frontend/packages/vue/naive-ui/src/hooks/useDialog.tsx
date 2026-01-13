import { getCurrentInstance, h, ref, shallowRef } from 'vue'
import { useDialog as useNaiveDialog, createDiscreteApi, type DialogOptions, NIcon } from 'naive-ui'
import { Info24Filled, ErrorCircle24Filled, CheckmarkCircle24Filled } from '@vicons/fluent'
import { themeProvider as ThemeProvider } from '../components/customProvider'
import type { CustomDialogOptions } from '../types/dialog'

// 自定义Dialog钩子函数
export default function useDialog(options?: CustomDialogOptions) {
	// 判断是否在setup中使用
	const instance = getCurrentInstance()
	// 创建响应式数据
	const optionsRef = ref<CustomDialogOptions>(options || {})
	// 创建Dialog实例
	const dialogInstance = shallowRef()
	// 创建Dialog方法
	const create = (optionsNew: CustomDialogOptions) => {
		const {
			type = 'warning',
			title,
			area,
			content,
			draggable = true,
			confirmText = '确定',
			cancelText = '取消',
			confirmButtonProps = { type: 'primary' },
			cancelButtonProps = { type: 'default' },
			maskClosable = false,
			closeOnEsc = false,
			autoFocus = false,
			onConfirm,
			onCancel,
			onClose,
			onMaskClick,
			...dialogOptions
		} = optionsNew

		// 转换area
		const areaConvert = () => {
			if (!area) return { width: '35rem', height: 'auto' }
			if (typeof area === 'string') return { width: area, height: 'auto' }
			return { width: area[0], height: area[1] }
		}

		// 转换content
		const contentConvert = () => {
			if (!content) return ''
			const Icon = (type: string) => {
				const typeIcon = {
					info: [<Info24Filled class="text-primary" />],
					success: [<CheckmarkCircle24Filled class="text-success" />],
					warning: [<Info24Filled class="text-warning" />],
					error: [<ErrorCircle24Filled class="text-error" />],
				}
				return h(NIcon, { size: 30, class: `n-dialog__icon` }, () => typeIcon[type as keyof typeof typeIcon][0])
			}
			const contentNew = h('div', { class: 'flex pt-[0.4rem]' }, [
				Icon(type),
				h('div', { class: 'w-full pt-1 flex items-center' }, typeof content === 'string' ? content : content()),
			])
			// 如果不在setup中使用
			if (!instance) return h(ThemeProvider, { type }, () => contentNew)
			return contentNew
		}

		// 合并Dialog配置
		const config: DialogOptions = {
			title,
			content: () => contentConvert(),
			style: areaConvert(),
			draggable,
			maskClosable,
			showIcon: false,
			closeOnEsc,
			autoFocus,
			positiveText: confirmText,
			negativeText: cancelText,
			positiveButtonProps: confirmButtonProps,
			negativeButtonProps: cancelButtonProps,
			onPositiveClick: onConfirm,
			onNegativeClick: onCancel,
			onClose,
			onMaskClick,
			...dialogOptions,
		}
		if (instance) {
			// 创建Dialog实例
			const naiveDialog = useNaiveDialog()
			dialogInstance.value = naiveDialog.create(config)
			return dialogInstance.value
		}

		// 创建discreteDialog实例
		const { dialog } = createDiscreteApi(['dialog'])
		dialogInstance.value = dialog.create(config)
		return dialogInstance.value
	}

	/**
	 * 成功-对话框
	 * @param options - 提示配置
	 * @returns 提示实例
	 */
	const success = (content: string, options: CustomDialogOptions = {}) => {
		return create({ ...options, type: 'success', content, showIcon: true })
	}

	/**
	 * 警告-对话框
	 * @param options - 提示配置
	 * @returns 提示实例
	 */
	const warning = (content: string, options: CustomDialogOptions = {}) => {
		return create({ ...options, type: 'warning', content })
	}

	/**
	 * 错误	- 对话框
	 * @param options - 提示配置
	 * @returns 提示实例
	 */
	const error = (content: string, options: CustomDialogOptions = {}) => {
		return create({ ...options, type: 'error', content })
	}

	/**
	 * 信息提示
	 * @param options - 提示配置
	 * @returns 提示实例
	 */
	const info = (content: string, options: CustomDialogOptions = {}) => {
		return create({ ...options, type: 'info', content })
	}

	/**
	 * 更新Dialog实例
	 * @param options - 提示配置
	 * @returns 提示实例
	 */
	const update = (options: CustomDialogOptions) => {
		optionsRef.value = options
		return create(options)
	}

	/**
	 * 请求结果提示
	 * @param options - 提示配置
	 * @param data - 请求结果
	 * @returns 提示实例
	 */
	const request = (data: Record<string, unknown>, options: CustomDialogOptions = {}) => {
		return create({ ...options, type: data.status ? 'success' : 'error', content: data.message as string })
	}

	// 销毁所有Dialog实例方法
	const destroyAll = () => {
		dialogInstance.value?.destroyAll()
	}

	const newReturn = { create, options: optionsRef, update, success, warning, error, info, request, destroyAll }
	// 如果配置为空
	if (!options) return newReturn

	return Object.assign(create(options), newReturn)
}
