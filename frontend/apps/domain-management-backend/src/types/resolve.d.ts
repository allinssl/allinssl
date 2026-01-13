/**
 * @fileoverview 域名解析相关类型定义
 * @description 提供域名解析、域名管理等功能相关的TypeScript类型定义
 */

import type { ResolveItem } from '@/views/domain-resolve/types'

/**
 * 获取域名信息请求参数
 */
export interface GetDomainInfoRequest {
	/** 域名ID */
	domain_id: number
	/** 域名类型：1=宝塔内部域名，2=外部域名 */
	domain_type?: number
}

/**
 * 域名信息响应数据
 */
export interface DomainInfoData {
	/** 域名ID */
	id: number
	/** 完整域名 */
	full_domain: string
	/** 域名类型 */
	domain_type: number
	/** 创建时间 */
	created_at: string
	/** 备注 */
	remark?: string
}

/**
 * 添加外部域名请求参数
 */
export interface AddExternalDomainRequest {
	/** 域名 */
	full_domain: string
	/** 备注 */
	remark?: string
}

/**
 * 添加外部域名响应数据
 */
export interface AddExternalDomainResponse {
	/** 域名ID */
	id: number
	/** 完整域名 */
	full_domain: string
	/** 域名类型 */
	domain_type: number
	/** 创建时间 */
	created_at: string
	/** 备注 */
	remark?: string
}

/**
 * 删除外部域名请求参数
 */
export interface RemoveDomainRequest {
	/** 域名ID */
	domain_id: number
}

/**
 * 删除外部域名响应数据
 */
export interface RemoveDomainResponse {
	/** 删除结果 */
	success: boolean
	/** 消息 */
	message?: string
}

/**
 * 检测域名状态请求参数
 */
export interface CheckDomainStatusRequest {
	/** 域名ID */
	domain_id: number
	/** 域名类型：1=宝塔内部域名，2=外部域名 */
	domain_type?: number
}

/**
 * 检测域名状态响应数据
 */
export interface CheckDomainStatusResponse {
	/** 检测结果 */
	success: boolean
	/** 域名状态：0=未设置，1=已生效，2=未生效 */
	ns_status: number
	/** 消息 */
	message?: string
}

/**
 * 域名解析列表响应数据
 */
export interface ResolveListResponse {
	/** 数据列表 */
	data: ResolveItem[]
	/** 总数 */
	total: number
}
