// Type imports
import type { useAxiosReturn } from '@baota/hooks/axios'
import type { AxiosResponseData } from '@/types/public'
import type {
	AddWorkflowParams,
	DeleteWorkflowParams,
	EnableWorkflowParams,
	ExecuteWorkflowParams,
	StopWorkflowParams,
	UpdateWorkflowExecTypeParams,
	UpdateWorkflowParams,
	WorkflowHistoryDetailParams,
	WorkflowHistoryParams,
	WorkflowHistoryResponse,
	WorkflowListParams,
	WorkflowListResponse,
} from '@/types/workflow' // Sorted types

// Relative internal imports
import { useApi } from '@api/index'

/**
 * @description 获取工作流列表
 * @param {WorkflowListParams} [params] 请求参数
 * @returns {useAxiosReturn<WorkflowListResponse, WorkflowListParams>} 获取工作流列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getWorkflowList = (
	params?: WorkflowListParams,
): useAxiosReturn<WorkflowListResponse, WorkflowListParams> =>
	useApi<WorkflowListResponse, WorkflowListParams>('/v1/workflow/get_list', params)

/**
 * @description 新增工作流
 * @param {AddWorkflowParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, AddWorkflowParams>} 新增工作流的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const addWorkflow = (params?: AddWorkflowParams): useAxiosReturn<AxiosResponseData, AddWorkflowParams> =>
	useApi<AxiosResponseData, AddWorkflowParams>('/v1/workflow/add_workflow', params)

/**
 * @description 修改工作流
 * @param {UpdateWorkflowParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, UpdateWorkflowParams>} 修改工作流的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const updateWorkflow = (
	params?: UpdateWorkflowParams,
): useAxiosReturn<AxiosResponseData, UpdateWorkflowParams> =>
	useApi<AxiosResponseData, UpdateWorkflowParams>('/v1/workflow/upd_workflow', params)

/**
 * @description 删除工作流
 * @param {DeleteWorkflowParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, DeleteWorkflowParams>} 删除工作流的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const deleteWorkflow = (
	params?: DeleteWorkflowParams,
): useAxiosReturn<AxiosResponseData, DeleteWorkflowParams> =>
	useApi<AxiosResponseData, DeleteWorkflowParams>('/v1/workflow/del_workflow', params)

/**
 * @description 获取工作流执行历史
 * @param {WorkflowHistoryParams} [params] 请求参数
 * @returns {useAxiosReturn<WorkflowHistoryResponse, WorkflowHistoryParams>} 获取工作流执行历史的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getWorkflowHistory = (
	params?: WorkflowHistoryParams,
): useAxiosReturn<WorkflowHistoryResponse, WorkflowHistoryParams> =>
	useApi<WorkflowHistoryResponse, WorkflowHistoryParams>('/v1/workflow/get_workflow_history', params)

/**
 * @description 获取工作流执行历史详情
 * @param {WorkflowHistoryDetailParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, WorkflowHistoryDetailParams>} 获取工作流执行历史详情的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getWorkflowHistoryDetail = (
	params?: WorkflowHistoryDetailParams,
): useAxiosReturn<AxiosResponseData, WorkflowHistoryDetailParams> =>
	useApi<AxiosResponseData, WorkflowHistoryDetailParams>('/v1/workflow/get_exec_log', params)

/**
 * @description 手动执行工作流
 * @param {ExecuteWorkflowParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, ExecuteWorkflowParams>} 手动执行工作流的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const executeWorkflow = (
	params?: ExecuteWorkflowParams,
): useAxiosReturn<AxiosResponseData, ExecuteWorkflowParams> =>
	useApi<AxiosResponseData, ExecuteWorkflowParams>('/v1/workflow/execute_workflow', params)

/**
 * @description 修改工作流执行方式
 * @param {UpdateWorkflowExecTypeParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, UpdateWorkflowExecTypeParams>} 修改工作流执行方式的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const updateWorkflowExecType = (
	params?: UpdateWorkflowExecTypeParams,
): useAxiosReturn<AxiosResponseData, UpdateWorkflowExecTypeParams> =>
	useApi<AxiosResponseData, UpdateWorkflowExecTypeParams>('/v1/workflow/exec_type', params)

/**
 * @description 启用工作流或禁用工作流
 * @param {EnableWorkflowParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, EnableWorkflowParams>} 启用或禁用工作流的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const enableWorkflow = (
	params?: EnableWorkflowParams,
): useAxiosReturn<AxiosResponseData, EnableWorkflowParams> =>
	useApi<AxiosResponseData, EnableWorkflowParams>('/v1/workflow/active', params)

/**
 * @description 停止工作流执行
 * @param {StopWorkflowParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, StopWorkflowParams>} 停止工作流执行的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const stopWorkflow = (params?: StopWorkflowParams): useAxiosReturn<AxiosResponseData, StopWorkflowParams> =>
	useApi<AxiosResponseData, StopWorkflowParams>('/v1/workflow/stop', params)
