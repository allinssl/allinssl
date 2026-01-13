// External library dependencies
import axios, { AxiosResponse } from 'axios'

// Type imports
import type { useAxiosReturn } from '@baota/hooks/axios'
import type {
	ApplyCertParams,
	ApplyCertResponse,
	CertListParams,
	CertListResponse,
	DeleteCertParams,
	DeleteCertResponse,
	DownloadCertParams,
	DownloadCertResponse, // Ensuring this type is imported
	UploadCertParams,
	UploadCertResponse,
} from '@/types/cert' // Path alias and sorted types

// Relative internal imports
import { useApi } from '@api/index'

/**
 * @description 获取证书列表
 * @param {CertListParams} [params] 请求参数
 * @returns {useAxiosReturn<CertListResponse, CertListParams>} 获取证书列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getCertList = (params?: CertListParams): useAxiosReturn<CertListResponse, CertListParams> =>
	useApi<CertListResponse, CertListParams>('/v1/cert/get_list', params)

/**
 * @description 申请证书
 * @param {ApplyCertParams} [params] 请求参数
 * @returns {useAxiosReturn<ApplyCertResponse, ApplyCertParams>} 申请证书的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const applyCert = (params?: ApplyCertParams): useAxiosReturn<ApplyCertResponse, ApplyCertParams> =>
	useApi<ApplyCertResponse, ApplyCertParams>('/v1/cert/apply_cert', params)

/**
 * @description 上传证书
 * @param {UploadCertParams} [params] 请求参数
 * @returns {useAxiosReturn<UploadCertResponse, UploadCertParams>} 上传证书的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const uploadCert = (params?: UploadCertParams): useAxiosReturn<UploadCertResponse, UploadCertParams> =>
	useApi<UploadCertResponse, UploadCertParams>('/v1/cert/upload_cert', params)

/**
 * @description 删除证书
 * @param {DeleteCertParams} [params] 请求参数
 * @returns {useAxiosReturn<DeleteCertResponse, DeleteCertParams>} 删除证书的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const deleteCert = (params?: DeleteCertParams): useAxiosReturn<DeleteCertResponse, DeleteCertParams> =>
	useApi<DeleteCertResponse, DeleteCertParams>('/v1/cert/del_cert', params)

/**
 * @description 下载证书
 * @param {DownloadCertParams} [params] 请求参数
 * @returns {Promise<AxiosResponse<DownloadCertResponse>>} 下载结果的 Promise 对象。
 */
export const downloadCert = (params?: DownloadCertParams): Promise<AxiosResponse<DownloadCertResponse>> => {
	return axios.get<DownloadCertResponse>('/v1/cert/download', { params })
}
