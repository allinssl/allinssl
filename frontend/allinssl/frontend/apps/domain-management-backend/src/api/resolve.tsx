/**
 * @fileoverview 域名解析相关 API 接口
 * @description 提供域名解析列表、域名管理等功能
 */

import { useApi } from '@api/index'
import type { ApiResponse } from '@/types/api'
import type { ResolveListRequest, ResolveItem } from '@/views/domain-resolve/types'
import type { 
	GetDomainInfoRequest, 
	DomainInfoData, 
	AddExternalDomainRequest, 
	AddExternalDomainResponse, 
	RemoveDomainRequest, 
	RemoveDomainResponse, 
	ResolveListResponse,
	CheckDomainStatusRequest,
	CheckDomainStatusResponse
} from '@/types/resolve'

/**
 * @description 获取域名解析列表
 * @param {ResolveListRequest} params 查询参数，包含分页、状态、关键词等
 * @returns {useAxiosReturn<ApiResponse<ResolveListResponse>, ResolveListRequest>} 返回域名解析列表数据
 */
export const getResolveList = (params: ResolveListRequest) =>
	useApi<ApiResponse<ResolveListResponse>, ResolveListRequest>('/v1/dns/manage/list_domains', params)

/**
 * @description 添加外部域名
 * @param {AddExternalDomainRequest} params 添加域名参数，包含域名和备注
 * @returns {useAxiosReturn<ApiResponse<AddExternalDomainResponse>, AddExternalDomainRequest>} 返回添加结果
 */
export const addExternalDomain = (params: AddExternalDomainRequest) =>
	useApi<ApiResponse<AddExternalDomainResponse>, AddExternalDomainRequest>('/v1/dns/manage/add_external_domain', params)

/**
 * @description 删除外部域名
 * @param {RemoveDomainRequest} params 删除域名参数，包含域名ID
 * @returns {useAxiosReturn<ApiResponse<RemoveDomainResponse>, RemoveDomainRequest>} 返回删除结果
 */
export const removeDomain = (params: RemoveDomainRequest) =>
	useApi<ApiResponse<RemoveDomainResponse>, RemoveDomainRequest>('/v1/dns/manage/remove_domain', params)

/**
 * @description 检测域名状态
 * @param {CheckDomainStatusRequest} params 检测参数，包含域名ID和域名类型
 * @returns {useAxiosReturn<ApiResponse<CheckDomainStatusResponse>, CheckDomainStatusRequest>} 返回检测结果
 */
export const checkDomainStatus = (params: CheckDomainStatusRequest) =>
	useApi<ApiResponse<CheckDomainStatusResponse>, CheckDomainStatusRequest>('/v1/dns/manage/check_domain_status', params)
