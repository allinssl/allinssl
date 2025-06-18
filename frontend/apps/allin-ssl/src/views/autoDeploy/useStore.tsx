import {
	getWorkflowList,
	deleteWorkflow,
	getWorkflowHistory,
	executeWorkflow,
	updateWorkflowExecType,
	enableWorkflow,
	stopWorkflow,
} from '@/api/workflow'
import { getEabList, addEab, deleteEab, updateEab } from '@/api/access'
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
import type { EabItem, EabListParams, EabAddParams, EabUpdateParams } from '@/types/access'
import type { TableResponse } from '@baota/naive-ui/types/table'

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

	// CA授权管理相关数据
	// ACME账户表单数据
	const caFormData = ref<EabAddParams & { id?: string }>({
		email: '',
		Kid: '',
		HmacEncoded: '',
		ca: 'zerossl',
		CADirURL: '',
	})

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

	/**
	 * 停止工作流执行
	 * @description 停止指定工作流的执行
	 * @param {string} id - 工作流ID
	 * @returns {Promise<void>} 停止执行结果
	 */
	const stopExistingWorkflow = async (id: string) => {
		try {
			const { message, fetch } = stopWorkflow({ id })
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_1_1747895712756'))
		}
	}

	/**
	 * 获取CA授权列表
	 * @param {EabListParams} params - 请求参数
	 * @returns {Promise<TableResponse<EabItem>>} 返回表格数据结构
	 */
	const fetchEabList = async <T = EabItem,>({ p, limit }: EabListParams) => {
		try {
			const { data, count } = await getEabList({ p, limit }).fetch()
			return { list: (data || []) as T[], total: count }
		} catch (error) {
			handleError(error)
			return { list: [], total: 0 }
		}
	}

	/**
	 * 添加CA授权
	 * @param {EabAddParams} params - CA授权数据
	 */
	const addNewEab = async (formData: EabAddParams): Promise<void> => {
		try {
			const { message, fetch } = addEab(formData)
			message.value = true
			await fetch()
			resetCaForm() // 重置表单
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * 更新CA授权
	 * @param {EabUpdateParams} params - CA授权更新数据
	 */
	const updateExistingEab = async (formData: EabUpdateParams): Promise<void> => {
		try {
			const { message, fetch } = updateEab(formData)
			message.value = true
			await fetch()
			resetCaForm() // 重置表单
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * 删除CA授权
	 * @param {string} id - CA授权ID
	 */
	const deleteExistingEab = async (id: string): Promise<void> => {
		try {
			const { message, fetch } = deleteEab({ id })
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_40_1745227838872'))
		}
	}

	/**
	 * 重置ACME账户表单
	 */
	const resetCaForm = () => {
		caFormData.value = {
			email: '',
			Kid: '',
			HmacEncoded: '',
			ca: 'zerossl',
			CADirURL: '',
		}
	}

	return {
		// 状态
		refreshTable,
		isEditWorkFlow,
		workflowFormData,
		workflowTemplateOptions,
		caFormData,

		// 方法
		fetchWorkflowList,
		fetchWorkflowHistory,
		deleteExistingWorkflow,
		executeExistingWorkflow,
		stopExistingWorkflow,
		setWorkflowActive,
		setWorkflowExecType,
		fetchEabList,
		addNewEab,
		updateExistingEab,
		deleteExistingEab,
		resetCaForm,
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