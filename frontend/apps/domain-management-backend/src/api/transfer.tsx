import { useApi } from '@api/index'
import type { ApiResponse } from '@/types/api'
import type {
	CreateTransferOrderRequest,
	CreateTransferOrderResponse,
	DomainTransferOutListRequest,
	DomainTransferOutListResponse,
	CancelTransferOutRequest,
	CancelTransferOutResponse,
	ApproveTransferOutRequest,
	ApproveTransferOutResponse,
	SendTransferCodeRequest,
	SendTransferCodeResponse,
	BtAccountTransferListRequest,
	BtAccountTransferListResponse,
	BtAccountTransferRequest,
	BtAccountTransferResponse,
	InsideTransferRequest,
	InsideTransferResponse,
	InsideTransferCancelRequest,
	InsideTransferCancelResponse,
} from '@/types/transfer'

export const createTransferOrder = (params: CreateTransferOrderRequest) =>
	useApi<CreateTransferOrderResponse, CreateTransferOrderRequest>('/v1/order/transfer_in', params) 

// 取消转入
export const cancelTransfer = (params: { record_id: number }) =>
	useApi<ApiResponse, { record_id: number }>('/v1/domain/transfer/cancel_transfer', params)

// 获取域名转出列表
export const fetchDomainTransferOutList = (params: DomainTransferOutListRequest) =>
	useApi<DomainTransferOutListResponse, DomainTransferOutListRequest>('/v1/domain/transfer/get_transfer_list', {...params,transfer_type:2})

// -------------------- 域名转出操作接口 --------------------

/**
 * 取消域名转出
 * @param params 取消转出请求参数
 * @returns 取消转出响应
 */
export const cancelDomainTransferOut = (params: CancelTransferOutRequest) =>
	useApi<CancelTransferOutResponse, CancelTransferOutRequest>('/v1/domain/transfer/outside_transfer_canel', params)

/**
 * 同意域名转出
 * @param params 同意转出请求参数
 * @returns 同意转出响应
 */
export const approveDomainTransferOut = (params: ApproveTransferOutRequest) =>
	useApi<ApproveTransferOutResponse, ApproveTransferOutRequest>('/v1/domain/transfer/outside_transfer_approve', params)

/**
 * 申请域名转出
 * @param params 发送转移码请求参数
 * @returns 发送转移码响应
 */
export const sendDomainTransferCode = (params: SendTransferCodeRequest) =>
	useApi<SendTransferCodeResponse, SendTransferCodeRequest>('/v1/domain/transfer/outside_transfer', params)

// -------------------- 堡塔账号转入相关接口 --------------------

/**
 * 获取堡塔账号转入列表
 * @param params 查询参数
 * @returns 堡塔账号转入列表响应
 */
export const fetchBtAccountTransferList = (params: BtAccountTransferListRequest) =>
	useApi<BtAccountTransferListResponse, BtAccountTransferListRequest>('/v1/domain/transfer/get_transfer_list', { ...params, transfer_type: 1 })

/**
 * 执行堡塔账号转入操作
 * @param params 堡塔账号转入请求参数
 * @returns 堡塔账号转入响应
 */
export const executeBtAccountTransfer = (params: BtAccountTransferRequest) =>
	useApi<BtAccountTransferResponse, BtAccountTransferRequest>('/v1/domain/transfer/inside_transfer_approve', params)

// -------------------- 域名内部转移相关接口 --------------------

/**
 * 申请域名内部转移
 * @param params 申请转移请求参数
 * @returns 申请转移响应
 */
export const applyInsideTransfer = (params: InsideTransferRequest) =>
	useApi<InsideTransferResponse, InsideTransferRequest>('/v1/domain/transfer/inside_transfer', params)

/**
 * 取消域名内部转移
 * @param params 取消转移请求参数
 * @returns 取消转移响应
 */
export const cancelInsideTransfer = (params: InsideTransferCancelRequest) =>
	useApi<InsideTransferCancelResponse, InsideTransferCancelRequest>('/v1/domain/transfer/inside_transfer_canel', params)
