import { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getProxyConfig, type ProxyConfig } from '@baota/utils/business'
import { isDev } from '@baota/utils/browser'
import { requestMiddleware } from './other'

/**
 * 代理请求中间件
 * @param {InternalAxiosRequestConfig<any>} config 请求配置
 * @param {boolean} dev 是否为开发环境
 * @returns {InternalAxiosRequestConfig<any>} 返回请求配置
 */
export const proxyRequestMiddle = requestMiddleware((config: AxiosRequestConfig, dev: boolean = isDev()) => {
	if (dev) {
		const { requestTime, requestToken } = getProxyConfig('request_token') as unknown as ProxyConfig
		config.params = {
			...config.params,
			request_time: requestTime,
			request_token: requestToken,
		}
	}
	return config
})
