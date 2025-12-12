import type { ApiResponse } from "./api";

/**
 * 订单概览与列表数据
 */
export interface OrderOverviewAndListData {
  /** 已取消订单数量 */
  cancelled_orders: number;
  /** 订单列表数据 */
  data: OrderItem[];
  /** 已完成订单数量 */
  finished_orders: number;
  /** 当前页码（字符串） */
  page: string;
  /** 待处理订单数量 */
  pending_orders: number;
  /** 每页条数（字符串） */
  row: string;
  /** 偏移量（字符串） */
  shift: string;
  /** 订单总数量 */
  total_orders: number;
  /** 总页数 */
  count: number;
}

/**
 * 订单列表项
 */
export interface OrderItem {
  /** 订单 ID */
  id: number;
  /** 金额（字符串表示） */
  total_amount: string;
  /** 创建时间（Unix 时间戳） */
  created_at: number;
  /** 关联域名 */
  full_domain: string;
  /** 订单类型（枚举） */
  order_type: number;
  /** 子订单号 */
  son_order_no: string;
  /** 订单状态（枚举） */
  status: number;
}

/**
 * 获取订单列表的请求参数
 */
export interface FetchOrdersRequest {
  /** 页码 */
  p?: number;
  /** 每页条数 */
  rows?: number;
  /** 订单号 */
  order_no?: string;
  /** 订单类型 */
  order_type?: number;
  /** 订单状态 */
  status?: number;
  /** 开始时间 */
  start_time?: number;
  /** 结束时间 */
  end_time?: number;
}

/**
 * 取消订单请求参数
 */
export interface CancelOrderRequest {
  /** 订单 ID */
  order_id: number;
  /** 取消原因 */
  cancel_reason: string;
}

/** 取消订单响应体 */
export type CancelOrderResponse = ApiResponse<{}>;

/**
 * 订单概览与列表响应体
 */
export type OrderOverviewAndListResponse =
  ApiResponse<OrderOverviewAndListData>;

// -------------------- 域名续费与支付状态 --------------------

/** 续费的单个域名项 */
export interface RenewDomainItem {
  domain: string;
  year: number; // 续费年限
  domain_service: number; // 扩展字段，后端要求固定0
}

/** 域名续费请求 */
export interface RenewRequest {
  domain_list: RenewDomainItem[];
}

/** 续费下单返回数据 */
export interface RenewData {
  create_time: string;
  discount_price: number;
  domain_count: number;
  expire_time: string;
  order_id: number;
  order_no: string;
  original_price: number;
  payment_url: string;
  total_price: number;
  ali: string; // 支付宝二维码或链接
  wx: string;  // 微信二维码或链接
}

/** 续费响应 */
export type RenewResponse = ApiResponse<RenewData>;

/** 查询支付状态请求 */
export interface PaymentStatusRequest { order_no: string }

/** 查询支付状态数据 */
export interface PaymentStatusData { status: number }

/** 查询支付状态响应 */
export type PaymentStatusResponse = ApiResponse<PaymentStatusData>


/**
 * 获取账户余额
 */
export interface GetAccountBalanceResponse {
  /** 状态码 */
  code: number;
  /** 线路列表 */
  data: {balance: number};
  /** 响应消息 */
  msg: string;
  /** 请求状态 */
  status: boolean;
}

/**
 * 账户余额下单
 */
export interface BalanceOrderRequest { order_no: string }

/**
 * 账户余额下单响应
 */
export interface BalanceOrderResponse {
	/** 状态码 */
	code: number
	/** 线路列表 */
	data: {}
	/** 响应消息 */
	msg: string
	/** 请求状态 */
	status: boolean
}