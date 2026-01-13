import { addWorkflow, updateWorkflow } from '@api/workflow'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'

import type { FlowNode } from '@components/FlowChart/types'
import type { AddWorkflowParams, UpdateWorkflowParams } from '@/types/workflow'

export const useWorkEditViewStore = defineStore('work-edit-view-store', () => {
	const { handleError } = useError()
	const isEdit = ref(false) // 是否编辑
	const detectionRefresh = ref(false) // 检测是否刷新, 用于检测是否刷新页面
	// 工作流数据
	const workflowData = ref<UpdateWorkflowParams>({
		id: '',
		name: '',
		content: '',
		active: '1',
		exec_type: 'manual',
	})

	// 工作流类型
	const workflowType = ref<'quick' | 'advanced'>('quick')

	// 工作流默认节点数据
	const workDefalutNodeData = ref<FlowNode>({
		id: '',
		name: '',
		childNode: {
			id: 'start-1',
			name: '开始',
			type: 'start',
			config: {
				exec_type: 'manual',
			},
			childNode: null,
		},
	})

	/**
	 * @description 重置工作流数据
	 */
	const resetWorkflowData = () => {
		workflowData.value = {
			id: '',
			name: '',
			content: '',
			active: '1',
			exec_type: 'manual',
		}
		workDefalutNodeData.value = {
			id: '',
			name: '',
			childNode: {
				id: 'start-1',
				name: '开始',
				type: 'start',
				config: {
					exec_type: 'manual',
				},
				childNode: null,
			},
		}
		workflowType.value = 'quick'
		isEdit.value = false
	}
	/**
	 * 添加新工作流
	 * @description 创建新的工作流配置
	 * @param {AddWorkflowParams} params - 工作流参数
	 * @returns {Promise<boolean>} 是否添加成功
	 */
	const addNewWorkflow = async (params: AddWorkflowParams) => {
		try {
			const { message, fetch } = addWorkflow(params)
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_10_1745457486451'))
		}
	}

	/**
	 * 设置工作流运行方式
	 * @description 设置工作流运行方式
	 * @param {number} id - 工作流ID
	 * @param {number} execType - 运行方式
	 */
	const updateWorkflowData = async (param: UpdateWorkflowParams) => {
		try {
			const { message, fetch } = updateWorkflow(param)
			message.value = true
			await fetch()
		} catch (error) {
			handleError(error).default($t('t_11_1745457488256'))
		}
	}
	return {
		isEdit,
		detectionRefresh,
		workflowData,
		workflowType,
		workDefalutNodeData,
		resetWorkflowData,
		addNewWorkflow,
		updateWorkflowData,
	}
})

/**
 * useStore
 * @description 组合式API使用store
 * @returns {object} store - 返回store对象
 */
export const useStore = () => {
	const store = useWorkEditViewStore()
	return { ...store, ...storeToRefs(store) }
}
