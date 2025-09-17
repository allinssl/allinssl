import { useApi } from '@api/index'
import type { ApiResponse } from '@/types/api'

/** 接口返回的 data 结构（成功时） */
export interface OperateLogData {
	created_at: string
	level: string
	log_id: number
	message: string
	module: string
	remote_addr: string
	request_method: string
	request_url: string
}
export interface OperateLogListData {
	data: OperateLogData[]
	count: number
	row: string
}

export type OperateLogResponse = ApiResponse<OperateLogListData>

// 操作日志查询参数接口
export interface OperateLogRequest {
	/** 页码，从 1 开始 */
	p?: number
	/** 每页条数 */
	rows?: number
	/** 关键字搜索，作用于日志 */
	keyword?: string
}
/**
 * @description 查询是否完成实名以及实名信息
 */
export const getOperateLog = (params: OperateLogRequest) =>
	useApi<OperateLogResponse, OperateLogRequest>('/v1/user/get_log', params)

