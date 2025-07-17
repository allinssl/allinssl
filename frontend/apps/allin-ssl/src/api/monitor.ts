// Type imports
import type { useAxiosReturn } from '@baota/hooks/axios'
import type {
	AddSiteMonitorParams,
	DeleteSiteMonitorParams,
	FileImportMonitorParams,
	FileImportMonitorResponse,
	GetErrorRecordParams,
	GetErrorRecordResponse,
	GetMonitorDetailParams,
	GetMonitorDetailResponse,
	SetSiteMonitorParams,
	SiteMonitorListParams,
	SiteMonitorListResponse,
	TemplateDownloadParams,
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
	useApi<SiteMonitorListResponse, SiteMonitorListParams>('/v1/monitor/get_list', params)

/**
 * @description 新增站点监控
 * @param {AddSiteMonitorParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, AddSiteMonitorParams>} 新增站点监控的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const addSiteMonitor = (
	params?: AddSiteMonitorParams,
): useAxiosReturn<AxiosResponseData, AddSiteMonitorParams> =>
	useApi<AxiosResponseData, AddSiteMonitorParams>('/v1/monitor/add_monitor', params)

/**
 * @description 修改站点监控
 * @param {UpdateSiteMonitorParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, UpdateSiteMonitorParams>} 修改站点监控的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const updateSiteMonitor = (
	params?: UpdateSiteMonitorParams,
): useAxiosReturn<AxiosResponseData, UpdateSiteMonitorParams> =>
	useApi<AxiosResponseData, UpdateSiteMonitorParams>('/v1/monitor/upd_monitor', params)

/**
 * @description 删除站点监控
 * @param {DeleteSiteMonitorParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, DeleteSiteMonitorParams>} 删除站点监控的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const deleteSiteMonitor = (
	params?: DeleteSiteMonitorParams,
): useAxiosReturn<AxiosResponseData, DeleteSiteMonitorParams> =>
	useApi<AxiosResponseData, DeleteSiteMonitorParams>('/v1/monitor/del_monitor', params)

/**
 * @description 启用/禁用站点监控
 * @param {SetSiteMonitorParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, SetSiteMonitorParams>} 启用/禁用站点监控的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const setSiteMonitor = (
	params?: SetSiteMonitorParams,
): useAxiosReturn<AxiosResponseData, SetSiteMonitorParams> =>
	useApi<AxiosResponseData, SetSiteMonitorParams>('/v1/monitor/set_monitor', params)

/**
 * @description 获取监控详情信息
 * @param {GetMonitorDetailParams} [params] 请求参数
 * @returns {useAxiosReturn<GetMonitorDetailResponse, GetMonitorDetailParams>} 获取监控详情信息的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getMonitorDetail = (
	params?: GetMonitorDetailParams,
): useAxiosReturn<GetMonitorDetailResponse, GetMonitorDetailParams> =>
	useApi<GetMonitorDetailResponse, GetMonitorDetailParams>('/v1/monitor/get_monitor_info', params)

/**
 * @description 获取监控错误记录
 * @param {GetErrorRecordParams} [params] 请求参数
 * @returns {useAxiosReturn<GetErrorRecordResponse, GetErrorRecordParams>} 获取监控错误记录的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getMonitorErrorRecord = (
	params?: GetErrorRecordParams,
): useAxiosReturn<GetErrorRecordResponse, GetErrorRecordParams> =>
	useApi<GetErrorRecordResponse, GetErrorRecordParams>('/v1/monitor/get_err_record', params)

/**
 * @description 文件导入监控
 * @param {FileImportMonitorParams} [params] 请求参数
 * @returns {useAxiosReturn<FileImportMonitorResponse, FileImportMonitorParams>} 文件导入监控的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const fileImportMonitor = (
	params?: FileImportMonitorParams,
): useAxiosReturn<FileImportMonitorResponse, FileImportMonitorParams> =>
	useApi<FileImportMonitorResponse, FileImportMonitorParams>('/v1/monitor/file_add_monitor', params)

/**
 * @description 下载监控模板
 * @param {TemplateDownloadParams} params 请求参数
 * @returns {Promise<Blob>} 返回模板文件的Blob对象
 */
export const downloadMonitorTemplate = async (params: TemplateDownloadParams): Promise<Blob> => {
	const response = await fetch(`/v1/monitor/template?type=${params.type}`, {
		method: 'GET',
	})

	if (!response.ok) {
		throw new Error(`下载模板失败: ${response.statusText}`)
	}

	return response.blob()
}
