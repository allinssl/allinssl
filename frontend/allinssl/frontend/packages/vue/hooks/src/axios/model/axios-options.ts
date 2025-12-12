import type { AxiosRequestConfig } from 'axios'
import { getCookie, isDev } from '@baota/utils/browser'
import { objectToQueryString } from '@baota/utils/data'
import { requestMiddleware } from './other'

/**
 * @description 请求头处理-基础
 * @param {AxiosRequestConfig} options 请求头参数
 * @param {boolean} isDev 是否为开发环境
 */
export const requestDefalutOptionsMiddles = requestMiddleware((options: AxiosRequestConfig, dev: boolean = isDev()) => {
	const defaultOpt: AxiosRequestConfig = {
		baseURL: dev ? '/api' : '', // 请求基础路径，相对路径用于追加到 baseURL
		timeout: 250000, // 请求超时时间： 250s
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		transformRequest: [objectToQueryString],
	}
	return { ...options, ...defaultOpt }
})

/**
 * @description 默认配置-面板配置
 * @param options
 */
export const requestPanelOptionsMiddle = requestMiddleware((options: AxiosRequestConfig, dev: boolean = isDev()) => {
	if (!dev) {
		const cookies = getCookie('request_token') // 获取请求头token
		options.headers = {
			...options.headers,
			...{ 'x-http-token': window.request_token },
			...(cookies ? { 'x-cookie-token': cookies } : {}),
		}
	}
	return options
})
