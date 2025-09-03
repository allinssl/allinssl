// External library dependencies
import axios, { AxiosResponse } from 'axios'

// Type imports
import type { useAxiosReturn } from '@baota/hooks/axios'
import type {
	CreateRootCaParams,
	CreateRootCaResponse,
	CreateIntermediateCaParams,
	CreateIntermediateCaResponse,
	GetCaListParams,
	GetCaListResponse,
	DeleteCaParams,
	DeleteCaResponse,
	DownloadCaCertParams,
	DownloadCaCertResponse,
	CreateLeafCertParams,
	CreateLeafCertResponse,
	GetLeafCertListParams,
	GetLeafCertListResponse,
	DeleteLeafCertParams,
	DeleteLeafCertResponse,
} from '@/types/ca'

import { useApi, createApiToken } from "@api/index";
import { isDev } from '@baota/utils/browser';

/**
 * @description 创建根证书
 * @param {CreateRootCaParams} [params] 请求参数
 * @returns {useAxiosReturn<CreateRootCaResponse, CreateRootCaParams>}
 */
export const createRootCa = (params?: CreateRootCaParams): useAxiosReturn<CreateRootCaResponse, CreateRootCaParams> =>
	useApi<CreateRootCaResponse, CreateRootCaParams>('/v1/private_ca/create_root_ca', params)

/**
 * @description 创建中间证书
 * @param {CreateIntermediateCaParams} [params] 请求参数
 * @returns {useAxiosReturn<CreateIntermediateCaResponse, CreateIntermediateCaParams>}
 */
export const createIntermediateCa = (params?: CreateIntermediateCaParams): useAxiosReturn<CreateIntermediateCaResponse, CreateIntermediateCaParams> =>
	useApi<CreateIntermediateCaResponse, CreateIntermediateCaParams>('/v1/private_ca/create_intermediate_ca', params)

/**
 * @description 获取CA列表
 * @param {GetCaListParams} [params] 请求参数
 * @returns {useAxiosReturn<GetCaListResponse, GetCaListParams>} 获取CA列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getCaList = (params?: GetCaListParams): useAxiosReturn<GetCaListResponse, GetCaListParams> =>
	useApi<GetCaListResponse, GetCaListParams>('/v1/private_ca/get_ca_list', params)

/**
 * @description 删除CA
 * @param {DeleteCaParams} [params] 请求参数
 * @returns {useAxiosReturn<DeleteCaResponse, DeleteCaParams>} 删除CA的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const deleteCa = (params?: DeleteCaParams): useAxiosReturn<DeleteCaResponse, DeleteCaParams> =>
	useApi<DeleteCaResponse, DeleteCaParams>('/v1/private_ca/del_ca', params)

/**
 * @description 获取下载CA证书的URL
 * @param {DownloadCaCertParams} [params] 请求参数
 * @returns {string} 拼接好的下载URL
 */
export const downloadCaCert = (params?: DownloadCaCertParams): string => {
	const apiParams = createApiToken()
	const finalParams = isDev() ? { ...(params || {}), ...apiParams } : params || {}
	
	// 构建查询字符串
	const searchParams = new URLSearchParams()
	if (finalParams) {
		Object.entries(finalParams).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				searchParams.append(key, String(value))
			}
		})
	}
	
	const queryString = searchParams.toString()
	const baseUrl = isDev() ? '/api' : '/'
	const fullUrl = queryString ? `${baseUrl}/v1/private_ca/download_cert?${queryString}` : `${baseUrl}/v1/private_ca/download_cert`
	return fullUrl
}

/**
 * @description 创建叶子证书
 * @param {CreateLeafCertParams} [params] 请求参数
 * @returns {useAxiosReturn<CreateLeafCertResponse, CreateLeafCertParams>} 创建叶子证书的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const createLeafCert = (params?: CreateLeafCertParams): useAxiosReturn<CreateLeafCertResponse, CreateLeafCertParams> =>
	useApi<CreateLeafCertResponse, CreateLeafCertParams>('/v1/private_ca/create_leaf_cert', params)

/**
 * @description 获取叶子证书列表
 * @param {GetLeafCertListParams} [params] 请求参数
 * @returns {useAxiosReturn<GetLeafCertListResponse, GetLeafCertListParams>} 获取叶子证书列表的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getLeafCertList = (params?: GetLeafCertListParams): useAxiosReturn<GetLeafCertListResponse, GetLeafCertListParams> =>
	useApi<GetLeafCertListResponse, GetLeafCertListParams>('/v1/private_ca/get_leaf_cert_list', params)

/**
 * @description 删除叶子证书
 * @param {DeleteLeafCertParams} [params] 请求参数
 * @returns {useAxiosReturn<DeleteLeafCertResponse, DeleteLeafCertParams>} 删除叶子证书的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const deleteLeafCert = (params?: DeleteLeafCertParams): useAxiosReturn<DeleteLeafCertResponse, DeleteLeafCertParams> =>
	useApi<DeleteLeafCertResponse, DeleteLeafCertParams>('/v1/private_ca/del_leaf_cert', params)