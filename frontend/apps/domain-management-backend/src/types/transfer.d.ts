import type { ApiResponse } from './api'

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