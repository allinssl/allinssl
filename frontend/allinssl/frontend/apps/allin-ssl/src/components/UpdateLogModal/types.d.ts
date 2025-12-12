// Type Imports
import type { Ref } from 'vue'
import type { VersionData } from '@/types/setting'

/**
 * @description 更新日志弹窗组件的 Props 定义
 */
export interface UpdateLogModalProps {
	/**
	 * 是否显示弹窗
	 * @default false
	 */
	show: boolean
	/**
	 * 版本数据
	 * @default null
	 */
	versionData: VersionData | null
}

/**
 * @description 更新日志弹窗组件的 Emits 定义
 */
export interface UpdateLogModalEmits {
	(e: 'update:show', show: boolean): void
}

/**
 * @description 更新日志弹窗控制器暴露给视图的数据和方法
 */
export interface UpdateLogModalControllerExposes {
	/**
	 * 格式化后的更新日志行数组
	 */
	formattedLog: Ref<string[]>
	/**
	 * 跳转到GitHub的方法
	 */
	goToGitHub: () => void
	/**
	 * 关闭弹窗的方法
	 */
	handleClose: () => void
}
