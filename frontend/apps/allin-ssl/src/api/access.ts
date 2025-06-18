// Type imports
import type { useAxiosReturn } from '@baota/hooks/axios'
import type {
	AccessListParams,
	AccessListResponse,
	AddAccessParams,
	DeleteAccessParams,
	GetAccessAllListParams,
	GetAccessAllListResponse,
	UpdateAccessParams,
	// CA授权相关类型
	EabListParams,
	EabListResponse,
	EabAddParams,
	EabUpdateParams,
	EabDeleteParams,
	EabGetAllListParams,
	EabGetAllListResponse,
	// 新增类型
	TestAccessParams,
	GetSitesParams,
	GetSitesResponse,
	GetPluginsActionsParams,
	GetPluginsResponse,
	GetPluginsActionsResponse,
} from '@/types/access' // Sorted types
import type { AxiosResponseData } from '@/types/public'

// Relative internal imports
import { useApi } from '@api/index'

/**
 * @description 获取授权列表
 * @param {AccessListParams} [params] 请求参数
 * @returns {useAxiosReturn<AccessListResponse, AccessListParams>} 获取授权列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getAccessList = (params?: AccessListParams): useAxiosReturn<AccessListResponse, AccessListParams> =>
	useApi<AccessListResponse, AccessListParams>('/v1/access/get_list', params)

/**
 * @description 新增授权
 * @param {AddAccessParams<string>} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, AddAccessParams<string>>} 新增授权的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const addAccess = (
	params?: AddAccessParams<string>,
): useAxiosReturn<AxiosResponseData, AddAccessParams<string>> =>
	useApi<AxiosResponseData, AddAccessParams<string>>('/v1/access/add_access', params)

/**
 * @description 修改授权
 * @param {UpdateAccessParams<string>} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, UpdateAccessParams<string>>} 修改授权的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const updateAccess = (
	params?: UpdateAccessParams<string>,
): useAxiosReturn<AxiosResponseData, UpdateAccessParams<string>> =>
	useApi<AxiosResponseData, UpdateAccessParams<string>>('/v1/access/upd_access', params)

/**
 * @description 删除授权
 * @param {DeleteAccessParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, DeleteAccessParams>} 删除授权的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const deleteAccess = (params?: DeleteAccessParams): useAxiosReturn<AxiosResponseData, DeleteAccessParams> =>
	useApi<AxiosResponseData, DeleteAccessParams>('/v1/access/del_access', params)

/**
 * @description 获取提供商列表
 * @param {GetAccessAllListParams} [params] 请求参数
 * @returns {useAxiosReturn<GetAccessAllListResponse, GetAccessAllListParams>} 获取DNS提供商列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getAccessAllList = (
	params?: GetAccessAllListParams,
): useAxiosReturn<GetAccessAllListResponse, GetAccessAllListParams> =>
	useApi<GetAccessAllListResponse, GetAccessAllListParams>('/v1/access/get_all', params)

/**
 * @description 获取ACME账户列表
 * @param {EabListParams} [params] 请求参数
 * @returns {useAxiosReturn<EabListResponse, EabListParams>} 获取ACME账户列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getEabList = (params?: EabListParams): useAxiosReturn<EabListResponse, EabListParams> =>
	useApi<EabListResponse, EabListParams>('/v1/acme_account/get_list', params)

/**
 * @description 添加ACME账户
 * @param {EabAddParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, EabAddParams>} 添加ACME账户的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const addEab = (params?: EabAddParams): useAxiosReturn<AxiosResponseData, EabAddParams> =>
	useApi<AxiosResponseData, EabAddParams>('/v1/acme_account/add_account', params)

/**
 * @description 修改ACME账户
 * @param {EabUpdateParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, EabUpdateParams>} 修改ACME账户的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const updateEab = (params?: EabUpdateParams): useAxiosReturn<AxiosResponseData, EabUpdateParams> =>
	useApi<AxiosResponseData, EabUpdateParams>('/v1/acme_account/upd_account', params)

/**
 * @description 删除ACME账户
 * @param {EabDeleteParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, EabDeleteParams>} 删除ACME账户的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const deleteEab = (params?: EabDeleteParams): useAxiosReturn<AxiosResponseData, EabDeleteParams> =>
	useApi<AxiosResponseData, EabDeleteParams>('/v1/acme_account/del_account', params)

/**
 * @description 获取CA授权列表下拉框
 * @param {EabGetAllListParams} [params] 请求参数
 * @returns {useAxiosReturn<EabGetAllListResponse, EabGetAllListParams>} 获取CA授权列表下拉框的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getAllEabList = (
	params?: EabGetAllListParams,
): useAxiosReturn<EabGetAllListResponse, EabGetAllListParams> =>
	useApi<EabGetAllListResponse, EabGetAllListParams>('/v1/access/get_all_eab', params)

/**
 * @description 测试授权API
 * @param {TestAccessParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, TestAccessParams>} 测试授权的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const testAccess = (params?: TestAccessParams): useAxiosReturn<AxiosResponseData, TestAccessParams> =>
	useApi<AxiosResponseData, TestAccessParams>('/v1/access/test_access', params)

/**
 * @description 获取网站列表
 * @param {GetSitesParams} [params] 请求参数
 * @returns {useAxiosReturn<GetSitesResponse, GetSitesParams>} 获取网站列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getSites = (params?: GetSitesParams): useAxiosReturn<GetSitesResponse, GetSitesParams> =>
	useApi<GetSitesResponse, GetSitesParams>('/v1/access/get_sites', params)

/**
 * @description 获取插件列表
 * @returns {useAxiosReturn<AxiosResponseData, void>} 获取插件列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getPlugins = (): useAxiosReturn<GetPluginsResponse, void> =>
	useApi<GetPluginsResponse, void>('/v1/access/get_plugins')

/**
 * @description 获取插件列表
 * @param {GetPluginsParams} [params] 请求参数
 * @returns {useAxiosReturn<GetPluginsResponse, GetPluginsActionsParams>} 获取插件列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getPluginsActions = (
	params: GetPluginsActionsParams,
): useAxiosReturn<GetPluginsActionsResponse, GetPluginsActionsParams> =>
	useApi<GetPluginsActionsResponse, GetPluginsActionsParams>('/v1/access/get_plugin_actions', params)



