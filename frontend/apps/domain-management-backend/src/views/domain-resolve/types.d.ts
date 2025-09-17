/**
 * 域名解析页面类型定义
 * 包含解析记录列表页面的状态接口、表单数据等类型
 */

/**
 * 标签类型（NTag组件使用）
 */
export type TagType = "default" | "success" | "warning" | "error" | "info";

/**
 * NS状态枚举
 */
export enum NsStatus {
	/** 未设置 */
	NotSet = 0,
	/** 已生效 */
	Active = 1,
	/** 未生效 */
	Pending = 2,
}

/**
 * 域名类型枚举
 */
export enum DomainType {
	/** 平台注册域名 */
	Platform = 1,
	/** 外部添加域名 */
	External = 2,
}

/**
 * 域名来源枚举
 */
export enum DomainSource {
	/** 平台注册 */
	Platform = "platform",
	/** 外部添加 */
	External = "external",
}

/**
 * 解析记录项接口
 */
export interface ResolveItem {
	/** 创建时间 */
	created_at: string;
	/** 51DNS中的域名ID，0表示未在51DNS中创建 */
	dns_id: number;
	/** 域名类型：1=平台注册域名，2=外部添加域名 */
	domain_type: number;
	/** 完整域名 */
	full_domain: string;
	/** 最后DNS状态检测时间 */
	last_check_time: string | null;
	/** 本地数据库中的域名ID */
	local_id: number;
	/** NS状态：0=未设置，1=已生效，2=未生效 */
	ns_status: number;
	/** DNS解析记录数量 */
	record_count: number;
	/** 备注信息 */
	remark: string;
	/** 域名来源：platform=平台注册，external=外部添加 */
	source: string;
}

/**
 * 解析记录列表请求参数
 */
export interface ResolveListRequest {
	/** 页码 */
	p?: number;
	/** 每页数量 */
	rows?: number;
	/** 搜索关键词 */
	keyword?: string;
	/** 状态筛选 */
	status?: number | string;
}

/**
 * 解析记录状态选项接口
 */
export interface StatusOption {
	/** 选项文本 */
	label: string;
	/** 选项值 */
	value: number | string;
}

/**
 * 解析记录状态配置接口
 */
export interface ResolveStatusConfig {
	/** 标签类型 */
	type: TagType;
	/** 显示文本 */
	text: string;
	/** 显示颜色 */
	color: string;
}

/**
 * 域名添加表单数据接口
 */
export interface DomainAddForm {
	/** 域名 */
	domain: string;
	/** 备注 */
	remark: string;
}

/**
 * DNS记录表单数据
 */
export interface DnsRecordForm {
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
