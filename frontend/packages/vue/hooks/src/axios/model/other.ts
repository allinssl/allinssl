import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

type RequestMiddlewareProps = (fn: (config: AxiosRequestConfig) => AxiosRequestConfig) => {
	request: (config: AxiosRequestConfig) => AxiosRequestConfig
}

type ResponseMiddlewareProps = (fn: (response: AxiosResponse) => AxiosResponse) => {
	response: (response: AxiosResponse) => AxiosResponse
}

/**
 * 构建Request 请求中间件
 * @param fn 请求中间件函数
 * @returns 请求中间件
 */
export const requestMiddleware: RequestMiddlewareProps = (fn: (config: AxiosRequestConfig) => AxiosRequestConfig) => ({
	request: fn,
})

/**
 * 构建Response 响应中间件
 * @param fn 响应中间件函数
 * @returns 响应中间件
 */
export const responseMiddleware: ResponseMiddlewareProps = (fn: (response: AxiosResponse) => AxiosResponse) => ({
	response: fn,
})

/**
 * 构建Error 错误中间件
 * @param fn 错误中间件函数
 * @returns 错误中间件
 */
export const errorMiddleware = (fn: (error: AxiosError) => AxiosError) => ({
	error: fn,
})
