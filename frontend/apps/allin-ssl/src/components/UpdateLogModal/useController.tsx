// External Libraries
import { computed } from 'vue'

// Type Imports
import type { UpdateLogModalProps, UpdateLogModalEmits, UpdateLogModalControllerExposes } from './types'

/**
 * @description 更新日志弹窗组件的控制器逻辑
 * @param props - 组件的 props
 * @param emit - 组件的 emit 函数
 * @returns {UpdateLogModalControllerExposes} 暴露给视图的响应式数据和方法
 */
export function useUpdateLogModalController(
	props: UpdateLogModalProps,
	emit: (event: 'update:show', payload: boolean) => void,
): UpdateLogModalControllerExposes {
	
	/**
	 * @description 处理更新日志文本，将 \r\n 和 \n 转换为换行
	 */
	const formattedLog = computed(() => {
		if (!props.versionData?.log) return []
		return props.versionData.log
			.replace(/\\r\\n/g, '\n')
			.replace(/\\n/g, '\n')
			.split('\n')
			.filter(line => line.trim() !== '')
	})

	/**
	 * @description 跳转到GitHub
	 */
	const goToGitHub = (): void => {
		window.open('https://github.com/allinssl/allinssl', '_blank')
		emit('update:show', false)
	}

	/**
	 * @description 关闭弹窗
	 */
	const handleClose = (): void => {
		emit('update:show', false)
	}

	return {
		formattedLog,
		goToGitHub,
		handleClose,
	}
}
