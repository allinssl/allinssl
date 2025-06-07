// Type imports
import type { useAxiosReturn } from '@baota/hooks/axios'
import type { AxiosResponseData } from '@/types/public'
import type {
	AddReportParams,
	DeleteReportParams,
	GetReportListParams,
	GetReportListResponse,
	GetSettingParams,
	GetSettingResponse,
	GetVersionParams,
	GetVersionResponse,
	SaveSettingParams,
	TestReportParams,
	UpdateReportParams,
} from '@/types/setting' // Sorted types

// Relative internal imports
import { useApi } from '@api/index'

/**
 * @description 获取系统设置
 * @param {GetSettingParams} [params] 请求参数
 * @returns {useAxiosReturn<GetSettingResponse, GetSettingParams>} 获取系统设置的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getSystemSetting = (params?: GetSettingParams): useAxiosReturn<GetSettingResponse, GetSettingParams> =>
	useApi<GetSettingResponse, GetSettingParams>('/v1/setting/get_setting', params)

/**
 * @description 保存系统设置
 * @param {SaveSettingParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, SaveSettingParams>} 保存系统设置的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const saveSystemSetting = (params?: SaveSettingParams): useAxiosReturn<AxiosResponseData, SaveSettingParams> =>
	useApi<AxiosResponseData, SaveSettingParams>('/v1/setting/save_setting', params)

/**
 * @description 添加告警
 * @param {AddReportParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, AddReportParams>} 添加告警的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const addReport = (params?: AddReportParams): useAxiosReturn<AxiosResponseData, AddReportParams> =>
	useApi<AxiosResponseData, AddReportParams>('/v1/report/add_report', params)

/**
 * @description 更新告警
 * @param {UpdateReportParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, UpdateReportParams>} 更新告警的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const updateReport = (params?: UpdateReportParams): useAxiosReturn<AxiosResponseData, UpdateReportParams> =>
	useApi<AxiosResponseData, UpdateReportParams>('/v1/report/upd_report', params)

/**
 * @description 删除告警
 * @param {DeleteReportParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, DeleteReportParams>} 删除告警的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const deleteReport = (params?: DeleteReportParams): useAxiosReturn<AxiosResponseData, DeleteReportParams> =>
	useApi<AxiosResponseData, DeleteReportParams>('/v1/report/del_report', params)

/**
 * @description 测试告警
 * @param {TestReportParams} [params] 请求参数
 * @returns {useAxiosReturn<AxiosResponseData, TestReportParams>} 测试告警的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const testReport = (params?: TestReportParams): useAxiosReturn<AxiosResponseData, TestReportParams> =>
	useApi<AxiosResponseData, TestReportParams>('/v1/report/notify_test', params)

/**
 * @description 获取告警类型列表
 * @param {GetReportListParams} [params] 请求参数
 * @returns {useAxiosReturn<GetReportListResponse, GetReportListParams>} 获取告警类型列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getReportList = (
	params?: GetReportListParams,
): useAxiosReturn<GetReportListResponse, GetReportListParams> =>
	useApi<GetReportListResponse, GetReportListParams>('/v1/report/get_list', params)

/**
 * @description 获取版本信息
 * @param {GetVersionParams} [params] 请求参数
 * @returns {useAxiosReturn<GetVersionResponse, GetVersionParams>} 获取版本信息的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getVersion = (params?: GetVersionParams): useAxiosReturn<GetVersionResponse, GetVersionParams> =>
	useApi<GetVersionResponse, GetVersionParams>('/v1/setting/get_version', params)
