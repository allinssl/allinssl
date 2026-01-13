/* Consolidated domain flash types. Do not edit by hand unless synchronizing spec. */

// --- flashsale.d.ts ---
export type SeckillActivityInfoResponseData = {
  // 是否可以抢券，false表示不可抢
  can_grab: boolean;
  // 优惠券价格，单位：元
  coupon_price: string;
  // 当前系统时间
  current_time: string;
  // 活动描述
  description: string;
  // 活动结束时间
  end_time: string;
  // 抢券状态：0=可抢，1=已抢到未使用，2=已使用，3=活动未开始，4=活动已结束，5=已抢完
  grab_status: number;
  // 是否有活动，true表示有活动
  has_activity: boolean;
  // 剩余优惠券数量
  remaining_coupons: number;
  // 活动开始时间
  start_time: string;
  // 状态文本描述
  status_text: string;
  // 总优惠券数量
  total_coupons: number;
  // 用户优惠券状态
  user_coupon: {
    // 0: 未领取，1: 已领取，2: 已使用
    status: number;
  };
};

// --- domain-flash-activity-info.d.ts ---
export interface GetActivityInfoRequest {
  activity_id?: string;
}

export interface ActivityData {
  type: number;
  starttime: string;
  endtime: string;
  detail: ActivityDetail[];
  discount_rate?: number;
  discount_amount?: number;
}

export interface ActivityDetail {
  /** 活动价 */
  activity_price: string;
  /** 购买按钮文案 */
  buy_message: string;
  /** 秒杀支付状态：1 可参与 / 2 已参与过 / 3 售空 */
  buy_status: number;
  // 0.未开始 1.进行中 2.已结束 3.已暂停
  status: number;
  /** 周期 */
  cycle: number;
  /** 赠品信息 */
  gifts: Gift[];
  /** 活动产品id */
  id: number;
  /** 产品名称 */
  name: string;
  /** 产品名称2 */
  product_name: string;
  /** 数量 */
  num: number;
  /** 原价 */
  original_price: string;
  /** 活动id */
  pid: number;
  /** 产品类型：1 官网产品 / 2 锐安信证书 / 3 宝塔证书 / 4 域名 */
  product_class: number;
  /** 产品id */
  product_id: number;
  /** 剩余库存，null 表示无限制 */
  remaining_stock: null;
  /** 秒杀配置（type=3 时存在） */
  seckill: SeckillConfig | null;
  seckill_daily: {
    activity_id: number;
    detail_id: number;
    end_time: string;
    id: number;
    is_first_day: number;
    remaining_stock: number;
    seckill_date: string;
    seckill_id: number;
    sold_count: number;
    start_time: string;
    status: number;
    total_stock: number;
  };
  /** 活动类型（同 ActivityData.type） */
  type: number;
  /** 周期单位：'month' | 'year' | 'day' */
  unit: string;

  [property: string]: unknown;
}

export interface SeckillConfig {
  activity_id: number;
  daily_start_time: string;
  detail_id: number;
  id: number;
  max_buy_count: number;
  price: string;
  seckill_end_date: string;
  seckill_start_date: string;
  status: number;
  [property: string]: unknown;
}

export type GetActivityInfoResponseData = ActivityData[];

// --- domain-flash-search.d.ts ---
export interface DomainSearchParams {
  domain: string;
}

export type DomainSearchData = Record<string, unknown>;

// --- domain-flash-order.d.ts ---
export interface CreateOrderParams {
  detail_id: number;
  domain?: string;
  seckill_daily_id: number;
}

export interface PaymentUrls {
  wechat: string;
  alipay: string;
}

export interface NormalOrderData {
  order_title: string;
  order_no: string;
  amount: number;
  payment_type?: string;
  expire_time: number | string;
  payment_urls: PaymentUrls;
}

export interface SeckillOrderData {
  task_id: string;
}

export type CreateOrderResponse = NormalOrderData | SeckillOrderData;

// --- domain-flash-seckill-status.d.ts ---
export interface SeckillStatusParams {
  task_id: string;
}

export type SeckillOrderCreatedData = NormalOrderData & { success: boolean };

export interface SeckillProcessingData {
  task_status?: "completed" | "processing" | "failed";
  result: SeckillOrderCreatedData;
}

/* Auto-generated based on domainflash.md. Do not edit by hand. */
/** 支付状态查询入参 */
export interface PaymentStatusParams {
  /** 订单号 */
  order_no: string;
}

/** 支付状态返回（status === 1 表示已支付） */
export interface PaymentStatusData {
  /** 订单号 */
  order_no: string;
  /** 支付时间（字符串或时间戳） */
  pay_time?: string | number;
  /** 支付方式 */
  pay_type?: string;
  /** 支付状态：1=已支付，0=未支付 */
  status: 1 | 0;
  /** 交易号（可选） */
  transaction_id?: string;
  /** 其他字段（兼容不同后端） */
  [key: string]: any;
}
