/**
 * 域名管理页面类型定义
 * 包含域名列表页面的状态接口、表单数据、概览卡片等类型
 */

/**
 * 标签类型（NTag组件使用）
 */
export type TagType = "default" | "success" | "warning" | "error" | "info";

/**
 * 域名状态枚举
 */
export enum DomainStatus {
  /** 注册中 */
  Pending = 0,
  /** 正常 */
  Active = 1,
  /** 即将到期 */
  Expiring = 2,
  /** 已过期 */
  Expired = 3,
  /** 待赎回 */
  Suspended = 4,
}

/**
 * 概览卡片类型
 */
export type OverviewCardType = "total" | "active" | "expiring" | "expired";

/**
 * 概览卡片接口
 */
export interface OverviewCard {
  /** 卡片唯一标识 */
  type: OverviewCardType;
  /** 卡片标题 */
  title: string;
  /** 卡片数值 */
  value: number;
  /** 卡片图标名称 */
  icon: string;
  /** 卡片颜色 */
  color: string;
  /** 卡片背景色 */
  bgColor: string;
  /** 点击跳转路径（可选） */
  path?: string;
}

/**
 * 标签类型（NTag组件使用）
 */
export type { TagType };

/**
 * 域名状态配置接口
 */
export interface DomainStatusConfig {
  /** 标签类型 */
  type: TagType;
  /** 显示文本 */
  text: string;
  /** 显示颜色 */
  color: string;
}

/**
 * 域名操作类型
 */
export type DomainActionType = "manage" | "dns" | "renew" | "transfer";

/**
 * 域名操作按钮配置
 */
export interface DomainActionConfig {
  /** 操作类型 */
  type: DomainActionType;
  /** 按钮文本 */
  text: string;
  /** 按钮类型 */
  buttonType: "primary" | "success" | "warning" | "error" | "info" | "default";
  /** 按钮图标（可选） */
  icon?: string;
}

/**
 * 域名后缀选项接口
 */
export interface SuffixOption {
  /** 选项文本 */
  label: string;
  /** 选项值 */
  value: string;
}

/**
 * 域名状态选项接口
 */
export interface StatusOption {
  /** 选项文本 */
  label: string;
  /** 选项值 */
  value: number | "";
}
