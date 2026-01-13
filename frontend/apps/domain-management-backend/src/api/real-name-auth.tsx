import { useApi } from '@api/index'
import type { ApiResponse } from '@/types/api'

/** 接口返回的 data 结构（成功时） */
export interface RealNameStatusData {
	id_card: string
	name: string
	phone: string
	/** 验证状态码，如“01” */
	verify_status: string
}

/**
 * 实名状态响应体
 * 成功：code=0，status=true，data 为实名信息
 * 失败：code!=0，status=false，data 为 {}
 */
export type RealNameStatusResponse = ApiResponse<RealNameStatusData | Record<string, never>>

export type RealNameStatusParams = Record<string, never>

/**
 * @description 查询是否完成实名以及实名信息
 */
export const queryRealNameStatus = () =>
	useApi<RealNameStatusResponse, RealNameStatusParams>('/v1/contact/get_user_status', {}) 