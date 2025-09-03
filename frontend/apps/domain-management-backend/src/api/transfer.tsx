import { useApi } from '@api/index'
import type { ApiResponse } from '@/types/api'
import type {
	CreateTransferOrderRequest,
	CreateTransferOrderResponse,
} from '@/types/transfer'

export const createTransferOrder = (params: CreateTransferOrderRequest) =>
	useApi<CreateTransferOrderResponse, CreateTransferOrderRequest>('/v1/order/transfer_in', params) 

// 取消转入
export const cancelTransfer = (params: { record_id: number }) =>
	useApi<ApiResponse, { record_id: number }>('/v1/domain/transfer/cancel_transfer', params)