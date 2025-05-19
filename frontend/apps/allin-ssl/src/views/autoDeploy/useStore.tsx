import {
	getWorkflowList,
	deleteWorkflow,
	getWorkflowHistory,
	executeWorkflow,
	updateWorkflowExecType,
	enableWorkflow,
} from '@/api/workflow'
import { useError } from '@baota/hooks/error'
// import { useMessage } from '@baota/naive-ui/hooks'
import { $t } from '@locales/index'
import type {
	WorkflowListParams,
	WorkflowHistoryParams,
	WorkflowHistoryItem,
	WorkflowItem,
	UpdateWorkflowExecTypeParams,
	EnableWorkflowParams,
} from '@/types/workflow'

const { handleError } = useError()

/**
 * 工作流状态管理 Store
 * @description 用于管理工作流相关的状态和操作，包括工作流列表、历史记录、分页等
 */
export const useWorkflowStore = defineStore('workflow-store', () => {
	// 刷新表格
	const refreshTable = ref(false)
	const isEditWorkFlow = ref(false) // 是否编辑工作流
	// 表单数据
	const workflowFormData = ref({
		name: '',
		templateType: 'quick',
	})

	// 模板选项
	const workflowTemplateOptions = ref([
		{ label: '快速部署模板', value: 'quick', description: '快速上线应用，简化流程' },
		{ label: '高级自定义模板', value: 'advanced', description: '完全自定义的部署流程' },
	])

	// -------------------- 工具方法 --------------------
	/**
	 * 获取工作流列表
	 * @description 根据分页参数获取工作流列表数据
	 * @returns {Promise<void>}
	 */
	const fetchWorkflowList = async <T = WorkflowItem,>({ p, limit, search }: WorkflowListParams) => {
		try {
			const { data, count } = await getWorkflowList({ p, limit, search }).fetch()
			return { list: (data || []) as T[], total: count }
		} catch (error) {
			handleError(error)
			return { list: [], total: 0 }
		}
	}

	/**
	 * 获取工作流历史记录
	 * @description 根据工作流ID获取其历史执行记录
	 * @param {number} workflowId - 工作流ID
	 * @returns {Promise<void>}
	 */
	const fetchWorkflowHistory = async <T = WorkflowHistoryItem,>({ id, p, limit }: WorkflowHistoryParams) => {
		try {
			const res = await getWorkflowHistory({ id, p, limit }).fetch()
			return { list: (res.data || []) as T[], total: res.count }
		} catch (error) {
			handleError(error)
			return { list: [], total: 0 }
		}
	}

	/**
	 * 设置工作流运行方式
	 * @description 设置工作流运行方式
	 * @param {number} id - 工作流ID
	 * @param {number} execType - 运行方式
	 */
	const setWorkflowExecType = async ({ id, exec_type }: UpdateWorkflowExecTypeParams) => {
		try {
			const { message, fetch } = updateWorkflowExecType({ id, exec_type })
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_11_1745457488256'))
		}
	}

	/**
	 * 启用或禁用工作流
	 * @description 启用或禁用指定工作流
	 * @param {number} id - 工作流ID
	 * @param {boolean} active - 是否启用
	 */
	const setWorkflowActive = async ({ id, active }: EnableWorkflowParams) => {
		try {
			const { message, fetch } = enableWorkflow({ id, active })
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_12_1745457489076'))
		}
	}

	/**
	 * 执行工作流
	 * @description 触发指定工作流的执行
	 * @param {number} id - 工作流ID
	 * @returns {Promise<boolean>} 是否执行成功
	 */
	const executeExistingWorkflow = async (id: string) => {
		try {
			const { message, fetch } = executeWorkflow({ id })
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_13_1745457487555'))
		}
	}

	/**
	 * 删除工作流
	 * @description 删除指定的工作流配置
	 * @param {number} id - 工作流ID
	 * @returns {Promise<boolean>} 是否删除成功
	 */
	const deleteExistingWorkflow = async (id: string) => {
		try {
			const { message, fetch } = deleteWorkflow({ id: id.toString() })
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_14_1745457488092'))
		}
	}

	return {
		// 状态
		refreshTable,
		isEditWorkFlow,
		workflowFormData,
		workflowTemplateOptions,

		// 方法
		fetchWorkflowList,
		fetchWorkflowHistory,
		deleteExistingWorkflow,
		executeExistingWorkflow,
		setWorkflowActive,
		setWorkflowExecType,
	}
})

/**
 * 组合式 API 使用 Store
 * @description 提供对工作流 Store 的访问，并返回响应式引用
 * @returns {Object} 包含所有 store 状态和方法的对象
 */
export const useStore = () => {
	const store = useWorkflowStore()
	return { ...store, ...storeToRefs(store) }
}
