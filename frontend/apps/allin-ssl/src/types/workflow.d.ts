import { AxiosResponseData } from './public'

/** 工作流列表请求参数 */
export interface WorkflowListParams {
	search?: string
	p?: number
	limit?: number
}

/** 工作流项 */
export interface WorkflowItem {
	id: string // 工作流ID
	name: string // 工作流名称
	active: string // 是否启用
	content: string // 工作流脚本
	exec_type: 'manual' | 'auto' // 执行类型
	exec_time: string // 执行时间配置
	last_run_status: 'success' | 'failed' | 'running' // 最后执行状态
	cron: string // 执行时间
	last_run_time: string // 最后执行时间
	update_time: string // 更新时间
	create_time: string | null // 创建时间
}

/** 工作流列表响应 */
export interface WorkflowListResponse extends AxiosResponseData {
	data: WorkflowItem[]
}

/** 添加工作流请求参数 */
export interface AddWorkflowParams {
	name: string
	exec_type: 'manual' | 'auto' | '' // 执行类型
	active: string // 是否启用
	// exec_time: string // 执行时间 (请求前保持 json 结构)
	content: string // 工作流脚本 (请求前保持 json 结构)
}

// /** 添加工作流响应 */
// export interface AddWorkflowResponse extends AxiosResponseData {
// 	data: null
// }

/** 修改工作流请求参数 */
export interface UpdateWorkflowParams extends AddWorkflowParams {
	id: string
}

/** 修改工作流响应 */
// export interface UpdateWorkflowResponse extends AxiosResponseData {
// 	data: {
// 		id: string
// 	}
// }

/** 删除工作流请求参数 */
export interface DeleteWorkflowParams {
	id: string
}

/** 删除工作流响应 */
export interface DeleteWorkflowResponse extends AxiosResponseData {
	data: null
}

/** 工作流执行历史请求参数 */
export interface WorkflowHistoryParams {
	id: string
	p?: number
	limit?: number
}

/** 工作流执行历史详情请求参数 */
export interface WorkflowHistoryDetailParams {
	id: string
}


/** 工作流历史执行记录 */
export interface WorkflowHistoryItem {
	id: string
	create_time: number
	end_time: string
	exec_type: 'auto' | 'manual'
	status: 'success' | 'failed' | 'running'
	workflow_id: string
}

/** 工作流执行历史响应 */
export interface WorkflowHistoryResponse extends AxiosResponseData {
	data: WorkflowHistoryItem[]
}

/** 手动执行工作流请求参数 */
export interface ExecuteWorkflowParams {
	id: string
}

/** 手动执行工作流响应 */
// export interface ExecuteWorkflowResponse extends AxiosResponseData {
// 	data: null
// }

/** 修改工作流执行方式请求参数 */
export interface UpdateWorkflowExecTypeParams {
	id: string
	exec_type: 'manual' | 'auto'
}

/** 启用工作流或禁用工作流请求参数 */
export interface EnableWorkflowParams {
	id: string
	active: string
}

/** 停止工作流请求参数 */
export interface StopWorkflowParams {
	id: string
}

