/**
 * @fileoverview 域名管理相关 API 接口
 * @description 提供域名列表查询、详情获取、DNS服务器更新、安全设置等功能
 */

import { useApi } from "@api/index";
import type {
	DomainListRequest,
	DomainListResponse,
	DomainDetailRequest,
	DomainDetailResponse,
	UpdateDnsServersRequest,
	UpdateDnsServersResponse,
	SetDomainSecurityRequest,
	SetDomainSecurityResponse,
	RefreshDomainStatusRequest,
	RefreshDomainStatusResponse,
	DomainPriceQueryRequest,
	DomainPriceQueryResponse,
	DomainAutoRenewRequest,
} from '@/types/domain'
import type {
  DomainTransferListRequest,
  DomainTransferListResponse,
} from '@/types/transfer'
import type {ApiResponse} from '@/types/api'

/**
 * @description 获取域名列表
 * @description 支持分页查询、状态筛选、后缀筛选和关键词搜索
 * @param {DomainListRequest} params 查询参数，包括分页、状态、后缀、关键词等
 * @returns {useAxiosReturn<DomainListResponse, DomainListRequest>} 返回域名列表数据
 */
export const fetchDomainList = (params: DomainListRequest) =>
  useApi<DomainListResponse, DomainListRequest>(
    "/v1/domain/manage/list",
    params,
  );

/**
 * @description 获取指定域名详情
 * @description 包括域名基本信息、DNS记录、实名认证信息等
 * @param {DomainDetailRequest} params 查询参数，包含域名ID
 * @returns {useAxiosReturn<DomainDetailResponse, DomainDetailRequest>} 返回域名详细信息
 */
export const fetchDomainDetail = (params: DomainDetailRequest) =>
  useApi<DomainDetailResponse, DomainDetailRequest>(
    "/v1/domain/manage/detail",
    params,
  );

/**
 * @description 更新域名DNS服务器
 * @description 修改域名的NS1和NS2服务器地址
 * @param {UpdateDnsServersRequest} params 更新参数，包含域名ID和新的DNS服务器地址
 * @returns {useAxiosReturn<UpdateDnsServersResponse, UpdateDnsServersRequest>} 返回更新结果
 */
export const updateDomainDnsServers = (params: UpdateDnsServersRequest) =>
  useApi<UpdateDnsServersResponse, UpdateDnsServersRequest>(
    "/v1/domain/manage/update_dns_servers",
    params,
  );

/**
 * @description 设置域名安全状态（禁止更新/禁止转移）
 * @description 控制域名的更新和转移权限
 * @param {SetDomainSecurityRequest} params 安全设置参数，包含域名ID、类型和状态
 * @returns {useAxiosReturn<SetDomainSecurityResponse, SetDomainSecurityRequest>} 返回设置结果
 */
export const setDomainSecurity = (params: SetDomainSecurityRequest) =>
  useApi<SetDomainSecurityResponse, SetDomainSecurityRequest>(
    "/v1/domain/manage/set_domain_security",
    params,
  );

/**
 * @description 手动刷新域名注册状态
 * @description 强制更新域名的注册状态信息
 * @param {RefreshDomainStatusRequest} params 刷新参数，包含域名ID
 * @returns {useAxiosReturn<RefreshDomainStatusResponse, RefreshDomainStatusRequest>} 返回刷新结果
 */
export const refreshDomainStatus = (params: RefreshDomainStatusRequest) =>
  useApi<RefreshDomainStatusResponse, RefreshDomainStatusRequest>(
    "/v1/domain/manage/refresh_domain_status",
    params,
  );

// 新增：域名价格查询
export const queryDomainPrice = (params:DomainPriceQueryRequest) =>
  useApi<DomainPriceQueryResponse,DomainPriceQueryRequest>(
    '/v1/domain/query/price',
    params,
  )

// 新增：获取域名转入列表
export const fetchDomainTransferList = (params: DomainTransferListRequest = {}) =>
  useApi<DomainTransferListResponse, DomainTransferListRequest>(
    '/v1/domain/transfer/get_transfer_list',
    params,
  )


// 自动续费
export const fetchDomainAutoRenew = (params: DomainAutoRenewRequest) =>
	useApi<ApiResponse, DomainAutoRenewRequest>('/v1/domain/manage/set_domain_auto_renew', params)


// 下载域名证书
export const downloadDomainCertificate = (params: { domain_id: number }) =>
	useApi<ApiResponse, { domain_id: number }>('/v1/domain/manage/get_cert', params)