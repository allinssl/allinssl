// Type imports
import type { useAxiosReturn } from '@baota/hooks/axios'
import type {
	AddSiteMonitorParams,
	DeleteSiteMonitorParams,
	SetSiteMonitorParams,
	SiteMonitorListParams,
	SiteMonitorListResponse,
	UpdateSiteMonitorParams,
} from '@/types/monitor' // Sorted types
import type { AxiosResponseData } from '@/types/public'

// Relative internal imports
import { useApi } from '@api/index'

/**
 * @description 获取站点监控列表
 * @param {SiteMonitorListParams} [params] 请求参数
 * @returns {useAxiosReturn<SiteMonitorListResponse, SiteMonitorListParams>} 获取站点监控列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getSiteMonitorList = (
	params?: SiteMonitorListParams,
): useAxiosReturn<SiteMonitorListResponse, SiteMonitorListParams> =>
	useApi<SiteMonitorListResponse, SiteMonitorListParams>('/v1/siteMonitor/get_list', params)

/**
 * @description 新增站点监控
 * @param {AddSiteMonitorParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, AddSiteMonitorParams>} 新增站点监控的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const addSiteMonitor = (params?: AddSiteMonitorParams): useAxiosReturn<AxiosResponseData, AddSiteMonitorParams> =>
	useApi<AxiosResponseData, AddSiteMonitorParams>('/v1/siteMonitor/add_site_monitor', params)

/**
 * @description 修改站点监控
 * @param {UpdateSiteMonitorParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, UpdateSiteMonitorParams>} 修改站点监控的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const updateSiteMonitor = (
	params?: UpdateSiteMonitorParams,
): useAxiosReturn<AxiosResponseData, UpdateSiteMonitorParams> =>
	useApi<AxiosResponseData, UpdateSiteMonitorParams>('/v1/siteMonitor/upd_site_monitor', params)

/**
 * @description 删除站点监控
 * @param {DeleteSiteMonitorParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, DeleteSiteMonitorParams>} 删除站点监控的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const deleteSiteMonitor = (
	params?: DeleteSiteMonitorParams,
): useAxiosReturn<AxiosResponseData, DeleteSiteMonitorParams> =>
	useApi<AxiosResponseData, DeleteSiteMonitorParams>('/v1/siteMonitor/del_site_monitor', params)

/**
 * @description 启用/禁用站点监控
 * @param {SetSiteMonitorParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, SetSiteMonitorParams>} 启用/禁用站点监控的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const setSiteMonitor = (params?: SetSiteMonitorParams): useAxiosReturn<AxiosResponseData, SetSiteMonitorParams> =>
	useApi<AxiosResponseData, SetSiteMonitorParams>('/v1/siteMonitor/set_site_monitor', params)
