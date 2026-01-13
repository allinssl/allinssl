/**
 * @fileoverview API 模块主入口文件
 * @description 提供 HTTP 客户端配置、中间件管理和通用请求方法
 * @author 系统自动生成
 * @version 1.0.0
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAxios, useAxiosReturn } from '@baota/hooks/axios'
import { useMessage } from '@baota/naive-ui/hooks'
import { HttpClient, requestMiddleware, responseMiddleware } from '@baota/hooks/axios/model'

/**
 * @description 判断是否为开发环境
 * @returns {boolean} 是否为开发环境
 */
const isDev = (): boolean => {
	// eslint-disable-next-line turbo/no-undeclared-env-vars
	return import.meta.env.DEV
}

/**
 * @description 认证中间件 - 添加 API Key 和 UID 到请求头
 * @param {AxiosRequestConfig} config 请求配置
 * @returns {AxiosRequestConfig} 处理后的请求配置
 */
const authMiddleware = requestMiddleware((config: AxiosRequestConfig) => {
	if (isDev()) {
		config.headers = {
			...config.headers,
			'X-UID': localStorage.getItem('x-uid') || '1112',
		}
	}
	return config
})

/**
 * @description 开发环境中间件 - 添加时间戳防止缓存
 * @param {AxiosRequestConfig} config 请求配置
 * @returns {AxiosRequestConfig} 处理后的请求配置
 */
const devMiddleware = requestMiddleware((config: AxiosRequestConfig) => {
	if (isDev()) {
		config.params = {
			...config.params,
			_t: Date.now(),
		}
	}
	return config
})

/**
 * @description 响应数据处理中间件
 * @param {AxiosResponse} response 响应对象
 * @returns {AxiosResponse} 处理后的响应对象
 */
const responseDataMiddleware = responseMiddleware((response: AxiosResponse) => {
	const message = useMessage()
	// 可以在这里统一处理响应数据格式
	const {
		data: { code, msg },
	} = response
	if (code === 1002 && msg === '身份失效') {
		setTimeout(() => {
			location.href = '/login'
		}, 2000)
		return message.error('登录状态已失效，页面将在2秒后自动跳转至登录页面')
	}
	return response
})

// 基础地址配置（可通过环境变量覆盖 legacy）
export const API_BASE = {
	default: isDev() ? (import.meta.env.VITE_ENABLE_MOCK === 'true' ? '/' : '/proxy/api') : '/api',
	legacy: (import.meta as any).env.VITE_API_BASE_LEGACY || '/',
}

/**
 * @description 创建 HTTP 客户端实例
 * @type {HttpClient}
 */
export const httpClient = new HttpClient({
	baseURL: API_BASE.default,
	// baseURL: '/proxy/api', //77150
	timeout: 600000,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
	middlewares: [authMiddleware, devMiddleware, responseDataMiddleware],
})

/**
 * @description 从 HTML 中提取数据总条数
 * @param {string} html内容
 * @returns 总条数
 */
export const getTotalCount = (html: string) => {
	// 匹配数据总条数的正则表达式
	const totalCountPattern = /<span class='Pcount'>共(\d+)条数据<\/span>/
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const totalMatch = html.match(totalCountPattern) as any[]

	// 如果匹配到结果，返回转换为数字的总条数，否则返回null
	return totalMatch ? parseInt(totalMatch[1], 10) : 0
}

/**
 * @description 通用 GET 请求方法
 * @template T 响应数据类型
 * @param {string} url 请求地址
 * @param {Record<string, any>} [params] 请求参数
 * @param {AxiosRequestConfig} [config] 请求配置
 * @returns {Promise<AxiosResponse<T>>} 请求结果
 */
export const get = <T, Z>(url: string, params?: Z, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
	return httpClient.get(url, { params, ...config })
}

/**
 * @description 通用 POST 请求方法
 * @template T 响应数据类型
 * @param {string} url 请求地址
 * @param {any} [data] 请求数据
 * @param {AxiosRequestConfig} [config] 请求配置
 * @returns {Promise<AxiosResponse<T>>} 请求结果
 * @example
 * ```typescript
 * const response = await post<CreateUserResponse>('/user/create', userData)
 * ```
 */
export const post = <T, Z = Record<string, unknown>>(
	url: string,
	data?: Z,
	config?: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {
	return httpClient.post<T>(url, data as Record<string, unknown>, config)
}

/**
/**
 * @description 创建axios请求
 * @param {string} url 请求地址
 * @param {Z} params 请求参数
 * @returns {useAxiosReturn<T, Z>} 返回结果
 */
export const useApi = <T, Z = Record<string, unknown>>(url: string, params?: Z) => {
	const { urlRef, paramsRef, ...other } = useAxios<T>(httpClient)
	urlRef.value = url
	paramsRef.value = isDev() ? { ...(params || {}) } : params || {}
	return {
		urlRef,
		paramsRef: paramsRef as unknown as Ref<Z>,
		...other,
	} as unknown as useAxiosReturn<T, Z>
}

// 导出 HTTP 客户端实例
export { httpClient as http }

// 导出 useAxios hook 用于组件中使用
export { useAxios }
