import type { ApiResponse } from './api'
import type { DomainTransferOutStatus, DomainTransferOutStatusConfig, BtAccountTransferStatus } from './transfer-enums'

export interface DomainTransferItem {
	id: number
	domain: string
	order_amount: string
	status: number
	status_text: string
	created_at: string
	complete_time: string
	updated_at: string
	msg: string
}

export interface DomainTransferListData {
	list: DomainTransferItem[]
	page: string
	row: string
	shift: string
	total: number
}

export interface DomainTransferListRequest {
	p?: number
	rows?: number
	keyword?: string
}

export type DomainTransferListResponse = ApiResponse<DomainTransferListData>

// -------------------- 三步流程：类型定义 --------------------

export interface TransferRowInput {
	domain: string
	transfer_code: string
}

export interface CreateTransferOrderRequest {
	domain_list: TransferRowInput[]
	real_name_template_id: number
}
export interface CreateTransferOrderData {
	order_no: string
	total_price: number
	wx: string
	ali: string
}
export type CreateTransferOrderResponse = ApiResponse<CreateTransferOrderData>

// -------------------- 域名转出相关类型定义 --------------------

export interface DomainTransferOutItem {
	id: number
	domain: string
	domain_id: number
	email: string
	status: number
	status_text: string
	created_at: string
	complete_time: string | null
	updated_at: string
	msg: string | null
	remark: string
}

export interface DomainTransferOutListData {
	list: DomainTransferOutItem[]
	page: string
	row: string
	shift: string
	total: number
}

export interface DomainTransferOutListRequest {
	p?: number
	rows?: number
	keyword?: string
	transfer_type?: number
}

export type DomainTransferOutListResponse = ApiResponse<DomainTransferOutListData>

// -------------------- 域名转出操作相关类型定义 --------------------

/**
 * 取消转出请求参数
 */
export interface CancelTransferOutRequest {
	/** 域名ID */
	domain_id: string | number
}

/**
 * 同意转出请求参数
 */
export interface ApproveTransferOutRequest {
	/** 域名ID */
	domain_id: string | number
}

/**
 * 转出操作响应数据
 */
export interface TransferOutOperationResponse {
	/** 操作是否成功 */
	success: boolean
	/** 响应消息 */
	message?: string
}

export type CancelTransferOutResponse = ApiResponse<TransferOutOperationResponse>
export type ApproveTransferOutResponse = ApiResponse<TransferOutOperationResponse>

// -------------------- 发送转移码相关类型定义 --------------------

/**
 * 发送转移码请求参数
 */
export interface SendTransferCodeRequest {
	/** 域名ID */
	domain_id: string
	/** 接收邮箱 */
	email: string
}

/**
 * 发送转移码响应数据
 */
export interface SendTransferCodeData {
	/** 成功发送的域名数量 */
	success_count: number
	/** 失败的域名列表 */
	failed_domains?: string[]
	/** 操作消息 */
	message: string
}

export type SendTransferCodeResponse = ApiResponse<SendTransferCodeData>

// -------------------- 堡塔账号转入相关类型定义 --------------------

/**
 * 堡塔账号转入列表项
 */
export interface BtAccountTransferItem {
	/** 记录ID */
	id: number
	/** 域名 */
	domain: string
	/** 域名ID */
	domain_id: number
	/** 源账号 */
	from_account: string
	/** 源用户ID */
	from_uid: number
	/** 状态 */
	status: BtAccountTransferStatus
	/** 状态文本 */
	status_text: string
	/** 创建时间 */
	created_at: string
	/** 完成时间 */
	complete_time: string | null
	/** 更新时间 */
	updated_at: string
	/** 消息 */
	msg: string | null
	/** 备注 */
	remark: string
}

/**
 * 堡塔账号转入列表数据
 */
export interface BtAccountTransferListData {
	list: BtAccountTransferItem[]
	page: string
	row: string
	shift: string
	total: number
}

/**
 * 堡塔账号转入列表请求参数
 */
export interface BtAccountTransferListRequest {
	p?: number
	rows?: number
	keyword?: string
	transfer_type?: number
}

export type BtAccountTransferListResponse = ApiResponse<BtAccountTransferListData>

/**
 * 堡塔账号转入域名项
 */
export interface BtAccountTransferDomainItem {
	/** 域名 */
	domain: string
	/** 转移码 */
	transfer_code: string
}

/**
 * 堡塔账号转入请求参数
 */
export interface BtAccountTransferRequest {
	/** 源堡塔账号 */
	from_account: string
	/** 域名列表 */
	domain_list: BtAccountTransferDomainItem[]
}

/**
 * 堡塔账号转入响应数据
 */
export interface BtAccountTransferData {
	/** 操作是否成功 */
	success: boolean
	/** 响应消息 */
	message?: string
}

export type BtAccountTransferResponse = ApiResponse<BtAccountTransferData>

// -------------------- 域名内部转移相关类型定义 --------------------

/**
 * 申请域名内部转移请求参数
 */
export interface InsideTransferRequest {
	/** 目标账号 */
	to_account: string
	/** 域名ID */
	domain_id: number
	/** 转移码 */
	transfer_code: string
}

/**
 * 申请域名内部转移响应数据
 */
export interface InsideTransferData {
	/** 操作是否成功 */
	success: boolean
	/** 响应消息 */
	message?: string
}

export type InsideTransferResponse = ApiResponse<InsideTransferData>

/**
 * 取消域名内部转移请求参数
 */
export interface InsideTransferCancelRequest {
	/** 域名ID */
	domain_id: number
}

/**
 * 取消域名内部转移响应数据
 */
export interface InsideTransferCancelData {
	/** 操作是否成功 */
	success: boolean
	/** 响应消息 */
	message?: string
}

export type InsideTransferCancelResponse = ApiResponse<InsideTransferCancelData>
