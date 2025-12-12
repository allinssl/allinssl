/**
 * @fileoverview 订单管理相关 API 接口
 * @description 提供用户订单查询、概览统计、订单取消等管理功能
 */

import { useApi } from '@api/index'
import type {
	OrderOverviewAndListResponse,
	FetchOrdersRequest,
	CancelOrderRequest,
	CancelOrderResponse,
	PaymentStatusResponse,
	RenewRequest,
	RenewResponse,
	PaymentStatusRequest,
	GetAccountBalanceResponse,
	BalanceOrderRequest,
	BalanceOrderResponse,
} from '@/types/order'

/**
 * @description 获取用户订单（概览 + 列表）
 * @description 获取用户的订单概览统计信息和订单列表，支持分页查询
 * @param {FetchOrdersRequest} [params={}] 查询参数，可选，包含分页、筛选等条件
 * @returns {useAxiosReturn<OrderOverviewAndListResponse, FetchOrdersRequest>} 返回订单概览和列表数据
 */
export const fetchOrders = (params: FetchOrdersRequest = {}) =>
  useApi<OrderOverviewAndListResponse, FetchOrdersRequest>('/v1/domain/manage/order_overview_and_list', params)

/**
 * @description 取消指定订单
 * @description 取消用户指定的订单，需要提供取消原因
 * @param {CancelOrderRequest} params 取消订单参数，包含订单ID和取消原因
 * @returns {useAxiosReturn<CancelOrderResponse, CancelOrderRequest>} 返回取消操作结果
 */
export const cancelOrder = (params: CancelOrderRequest) =>
  useApi<CancelOrderResponse, CancelOrderRequest>('/v1/order/cancel', params)

// -------------------- 续费与支付状态 --------------------
export const renewOrder = (params: RenewRequest) =>
  useApi<RenewResponse, RenewRequest>('/v1/order/renew', params)

export const queryPaymentStatus = (params: PaymentStatusRequest) =>
  useApi<PaymentStatusResponse, PaymentStatusRequest>('/v1/order/payment/status', params)

/**
 * @description 获取账户余额
 * @returns {useAxiosReturn<GetAccountBalanceResponse>} 返回账户余额数据
 */
export const getAccountBalance = () => useApi<GetAccountBalanceResponse>('/v1/order/buy/get_buy')

/**
 * @description 账户余额下单
 * @param {BalanceOrderRequest} params 创建订单参数，包含订单类型、购物车ID等
 * @returns {useAxiosReturn<BalanceOrderResponse, BalanceOrderRequest>} 返回创建订单结果
 */
export const buyByBalance = (params: BalanceOrderRequest) =>
	useApi<BalanceOrderResponse, BalanceOrderRequest>('/v1/order/buy/buy_payment', params)