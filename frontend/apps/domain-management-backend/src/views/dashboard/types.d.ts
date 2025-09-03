/**
 * 仪表板页面相关类型定义
 */

import type { INotificationItem } from "@/components/layout/types";

/** 快捷操作项接口 */
export interface QuickAction {
  /** 操作标题 */
  title: string;
  /** 图标名称 */
  icon: string;
  /** 图标颜色 */
  iconColor: string;
  /** 点击跳转路径 */
  path: string;
  /** 按钮类型 */
  type?: "primary" | "info" | "success" | "warning" | "error";
}

/** 数据总览卡片类型 */
export interface OverviewCard {
  /** 卡片标题 */
  title: string;
  /** 数值 */
  value: string | number;
  /** 描述文本 */
  description: string;
  /** 图标名称 */
  icon: string;
  /** 图标颜色 */
  iconColor: string;
  /** 点击跳转路径 */
  path?: string;
}

/** 域名状态概览项 */
export interface DomainOverviewItem {
  /** 域名ID */
  id: number;
  /** 域名名称 */
  name: string;
  /** 到期时间 */
  expireDate: string;
  /** 状态 */
  status: "active" | "inactive" | "expired" | "pending" | "suspended";
}

/** 订单项 */
export interface OrderItem {
  /** 订单ID */
  id: string;
  /** 订单类型 */
  type: "register" | "renewal" | "transfer";
  /** 域名名称 */
  domainName: string;
  /** 价格 */
  price: number;
  /** 订单时间 */
  time: string;
  /** 订单状态 */
  status: "completed" | "pending" | "failed";
}

/** 仪表板数据 */
export interface DashboardData {
  /** 我的域名总数 */
  totalDomains: number;
  /** 即将到期域名数 */
  expiringDomains: number;
  /** 待支付订单数 */
  pendingOrders: number;
  /** 账户余额 */
  accountBalance: number;
  /** 域名列表 */
  domains: DomainOverviewItem[];
  /** 订单列表 */
  orders: OrderItem[];
  /** 通知列表 */
  notifications: INotificationItem[];
}
