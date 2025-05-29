// External Libraries (sorted alphabetically by module path)
import { HttpClient, useAxios, useAxiosReturn } from '@baota/hooks/axios'
import { errorMiddleware } from '@baota/hooks/axios/model'
import { isDev } from '@baota/utils/browser'
import { AxiosError } from 'axios'
import MD5 from 'crypto-js/md5'

// Type Imports (sorted alphabetically by module path)
import type { AxiosResponseData } from '@/types/public'
import type { Ref } from 'vue'

// Relative Internal Imports (sorted alphabetically by module path)
import { router } from '@router/index'

/**
 * @description 处理返回数据，如果状态码为 401 或 404
 * @param {AxiosError} error 错误对象
 * @returns {AxiosError} 错误对象
 */
export const responseHandleStatusCode = errorMiddleware((error: AxiosError) => {
	// 处理 401 状态码
	if (error.status === 401) {
		router.push(`/login`)
	}
	// 处理404状态码
	if (error.status === 404) {
		// router.go(0) // 刷新页面
	}
	return error
})

/**
 * @description 返回数据
 * @param {T} data 数据
 * @returns {AxiosResponseData<T>} 返回数据
 */
export const useApiReturn = <T>(data: T, message?: string): AxiosResponseData<T> => {
	return {
		code: 200,
		count: 0,
		data,
		message: message || '请求返回值错误，请检查',
		status: false,
	} as AxiosResponseData<T>
}

/**
 * @description 创建http客户端实例
 */
export const instance = new HttpClient({
	baseURL: isDev() ? '/api' : '/',
	timeout: 50000,
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	},
	middlewares: [responseHandleStatusCode],
})

/**
 * @description API Token 结构
 */
interface ApiTokenResult {
	api_token: string
	timestamp: number
}

/**
 * @description 创建api token
 * @returns {ApiTokenResult} 包含API token和时间戳的对象
 */
export const createApiToken = (): ApiTokenResult => {
	const now = new Date().getTime()
	const apiKey = '123456' // 注意: 此处为硬编码密钥，建议后续优化
	const api_token = MD5(now + MD5(apiKey).toString()).toString()
	return { api_token, timestamp: now }
}

/**
 * @description 创建axios请求
 * @param {string} url 请求地址
 * @param {Z} [params] 请求参数
 * @returns {useAxiosReturn<T, Z>} 返回结果
 */
export const useApi = <T, Z = Record<string, unknown>>(url: string, params?: Z) => {
	const { urlRef, paramsRef, ...other } = useAxios<T>(instance)
	const apiParams = createApiToken()
	urlRef.value = url
	paramsRef.value = isDev() ? { ...(params || {}), ...apiParams } : params || {}
	return { urlRef, paramsRef: paramsRef as Ref<Z>, ...other } as useAxiosReturn<T, Z>
}

// 导出所有模块
export * from './public'
export * from './workflow'
export * from './cert'
export * from './access'
export * from './monitor'
export * from './setting'
