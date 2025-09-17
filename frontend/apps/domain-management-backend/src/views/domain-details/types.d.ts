/**
 * 域名详情页面类型定义
 */

import type {
  DomainInfo,
  DnsRecordItem,
  RealNameInfo,
  DomainLogItem,
} from "@/types/domain";

/**
 * 域名详情标签页类型
 */
export type DomainDetailTabKey = 'base' | 'realName' | 'security' | 'analysis' | 'logs'

/**
 * DNS记录表单数据
 */
interface DnsRecordForm {
  record_id?: string | number;
  /** 主机记录 */
  record: string;
  /** 记录类型 */
  type: string;
  /** 记录值 */
  value: string;
  /** MX值 */
  mx: number;
  /** TTL值 */
  ttl: number;
  /** 备注 */
  remark: string;
  /** 线路ID */
  viewId: number;
}

/**
 * DNS记录类型选项
 */
export interface DnsTypeOption {
  /** 类型值 */
  value: string;
  /** 类型标签 */
  label: string;
  /** 类型描述 */
  description: string;
  /** 示例值 */
  example: string;
}

/**
 * TTL选项
 */
export interface TtlOption {
  /** TTL值 */
  value: number;
  /** 显示标签 */
  label: string;
}

/**
 * 标签类型
 */
export type TagType = "default" | "success" | "warning" | "error" | "info";

/**
 * 操作日志筛选表单
 */
export interface LogFilterFormData {
  /** 操作类型 */
  operation_type: string | null;
  /** 开始时间 */
  start_time: number | null;
  /** 结束时间 */
  end_time: number | null;
}

/**
 * 操作日志项
 */
export interface OperationLogItem {
  /** 日志ID */
  id: number;
  /** 操作类型 */
  operation_type: string;
  /** 操作内容 */
  content: string;
  /** 操作人 */
  operator: string;
  /** 操作IP */
  ip: string;
  /** 操作时间 */
  created_at: number;
  /** 操作状态 */
  status: "success" | "warning" | "error" | "info";
}
