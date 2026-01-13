/**
 * 订单管理页面类型定义
 */

/**
 * 订单状态枚举
 */
export enum OrderStatus {
  /** 待处理 */
  PENDING = 0,
  /** 已完成 */
  COMPLETED = 1,
  /** 已取消 */
  CANCELLED = 2,
}

/**
 * 订单类型枚举
 */
export enum OrderType {
  /** 域名注册 */
  DOMAIN_REGISTER = 1,
  /** 域名续费 */
  DOMAIN_RENEW = 2,
  /** 域名转入 */
  DOMAIN_TRANSFER = 3,
}

/**
 * 订单状态映射类型
 */
export type OrderStatusKey = keyof typeof ORDER_STATUS_MAP;

/**
 * 订单类型映射类型
 */
export type OrderTypeKey = keyof typeof ORDER_TYPE_MAP;

/**
 * NTag组件类型
 */
export type TagType = "default" | "success" | "warning" | "error" | "info";

/**
 * 概览卡片类型
 */
export type OverviewCardType = "total" | "pending" | "completed" | "cancelled";

/**
 * 订单概览统计数据
 */
export interface OrderOverviewStats {
  /** 全部订单数量 */
  totalOrders: number;
  /** 待处理订单数量 */
  pendingOrders: number;
  /** 已完成订单数量 */
  completedOrders: number;
  /** 已取消订单数量 */
  cancelledOrders: number;
}

/**
 * 概览卡片数据接口
 */
export interface OverviewCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
  type?: OverviewCardType;
}

/**
 * 订单状态选项
 */
export interface OrderStatusOption {
  label: string;
  value: number;
}

/**
 * 订单类型选项
 */
export interface OrderTypeOption {
  label: string;
  value: number;
}
