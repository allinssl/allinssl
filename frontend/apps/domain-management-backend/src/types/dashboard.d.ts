import type { ApiResponse } from "./api";

/**
 * 域名状态统计项
 * 用于仪表板域名状态 Top 列表展示
 */
export interface DomainStatusTopItem {
  id: number;
  /** 过期时间，ISO 字符串或 null 表示无过期时间 */
  expire_time: string | null;
  /** 完整域名，例如 example.com */
  full_domain: string;
  /** 域名状态码，详见业务约定 */
  status: number;
}

/**
 * 最近订单条目
 * - 用于仪表板最近订单列表
 * - 注意：部分字段来自后端表格列映射，非所有接口都返回，故设为可选
 */
export interface RecentOrderItem {
  /** 关联的完整域名 */
  full_domain: string;
  /** 订单类型，数值枚举 */
  order_type: number;
  /** 订单状态，数值枚举 */
  status: number;
  /** 订单总金额，字符串表示的金额 */
  total_amount: string;
  /** 最近更新时间，时间戳或格式化字符串 */
  updated_at: number | string;
  // 可能存在的字段（从文档表格推断，设为可选）
  /** 取消原因，可为空 */
  cancel_reason?: string | null;
  /** 取消时间，格式化字符串或 null */
  cancel_time?: string | null;
  /** 完成时间，格式化字符串或 null */
  complete_time?: string | null;
  /** 创建时间，Unix 时间戳（秒） */
  created_at?: number;
  /** 过期时间，格式化字符串或 null */
  expire_time?: string | null;
  /** 订单 ID */
  id?: number;
  /** 是否为主订单（1 是，0 否） */
  is_main_order?: number;
  /** 订单编号 */
  order_no?: string;
  /** 产品类型 */
  product_type?: string;
  /** 退款原因，可为空 */
  refund_reason?: string | null;
  /** 退款时间，格式化字符串或 null */
  refund_time?: string | null;
  /** 订单来源 */
  source?: string;
  /** 总条数或合计数量（根据上下文） */
  total?: number;
  /** 用户 ID */
  uid?: number;
}

/**
 * 仪表板总览数据
 */
export interface DashboardOverviewData {
  /** 域名状态 Top 列表（可选） */
  domain_status_top?: DomainStatusTopItem[];
  /** 将要过期的域名数量 */
  expiring_domains: number;
  /** 将要过期的域名 Top10（可选） */
  expiring_domains_top10?: DomainStatusTopItem[];
  /** 待处理订单数量 */
  pending_orders: number;
  /** 最近订单列表 */
  recent_orders: RecentOrderItem[];
  /** 域名总数 */
  total_domains: number;
}

/**
 * 仪表板总览响应体
 */
export type DashboardOverviewResponse = ApiResponse<DashboardOverviewData>;

/** -------------------- 购物车类型 -------------------- */
export interface CartItem {
	/** 关联的完整域名 */
	full_domain: string
	/** 订单类型，数值枚举 */
	order_type: number
	/** 订单状态，数值枚举 */
	status: number
	/** 订单总金额，字符串表示的金额 */
	total_amount: string
	/** 兼容字段：有些接口可能返回 price（number，元） */
	price?: number
	/** 年限 */
	years?: number
	/** 最近更新时间，时间戳或格式化字符串 */
	updated_at: number | string
	// 可能存在的字段（从文档表格推断，设为可选）
	/** 取消原因，可为空 */
	cancel_reason?: string | null
	/** 取消时间，格式化字符串或 null */
	cancel_time?: string | null
	/** 完成时间，格式化字符串或 null */
	complete_time?: string | null
	/** 创建时间，Unix 时间戳（秒） */
	created_at?: number
	/** 过期时间，格式化字符串或 null */
	expire_time?: string | null
	/** 订单 ID */
	id?: number
	/** 是否为主订单（1 是，0 否） */
	is_main_order?: number
	/** 订单编号 */
	order_no?: string
	/** 产品类型 */
	product_type?: string
	/** 退款原因，可为空 */
	refund_reason?: string | null
	/** 退款时间，格式化字符串或 null */
	refund_time?: string | null
	/** 订单来源 */
	source?: string
	/** 总条数或合计数量（根据上下文） */
	total?: number
	/** 用户 ID */
	uid?: number
	/** 是否选中 */
	selected?: number
}

export interface CartListData {
	/** 购物车条目列表 */
	items: CartItem[]
	/** 原价合计（未优惠） */
	original_price: number
	/** 已选中条目的数量 */
	selected_count: number
	/** 已选中条目的价格合计 */
	selected_price: number
	/** 购物车总条目数量 */
	total_count: number
	/** 购物车总价（可能包含优惠后价格） */
	total_price: number
}

export type CartListResponse = ApiResponse<CartListData>;

export interface UpdateCartRequest {
	/** 购物车ID */
	cart_id: number
	/** 年限 */
	years: number
	/** 是否选中 */
	is_selected: number
}

export type UpdateCartResponse = ApiResponse<CartItem>

/** 购物车移除接口类型 */
export interface RemoveCartItemRequest {
	cart_id: number
}
export interface RemoveCartItemData {
	data: { cart_id: number, success: boolean }
	message: string
	code: number
	status: boolean
}
export type RemoveCartItemResponse = ApiResponse<RemoveCartItemData>

// -------------------- 结算 / 下单相关类型 --------------------

/** 创建订单请求 */
export interface CreateOrderRequest {
	/** 实名模板ID */
	real_name_template_id: number
	/** 订单类型：0-域名注册（默认） */
	order_type: number
	/** 购物车ID列表（1-20个元素） */
	cart_ids: number[]
}
export interface CreateOrderPayInfo {
	/** 支付宝支付链接 */
	ali: string
	/** 订单创建时间 */
	create_time: string
	/** 折扣金额 */
	discount_price: number
	/** 域名数量 */
	domain_count: number
	/** 订单过期时间 */
	expire_time: string
	/** 订单ID */
	order_id: number
	/** 订单编号 */
	order_no: string
	/** 原价 */
	original_price: number
	/** 支付链接 */
	payment_url: string
	/** 总价 */
	total_price: number
	/** 微信支付链接 */
	wx: string
}

/** 创建订单响应 */
export type CreateOrderResponse = ApiResponse<CreateOrderPayInfo>
