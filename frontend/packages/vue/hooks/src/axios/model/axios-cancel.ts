import { AxiosRequestConfig } from 'axios'
import { requestMiddleware } from './other'

// * 声明一个 Map 用于存储每个请求的标识 和 取消函数
export const pendingMap = new Map<string, AbortController>()

// 获取请求的唯一标识
// const getAbortUrl = (config: AxiosRequestConfig) => config.url

/**
 * 添加取消请求中间件
 * @param {AxiosRequestConfig} config 请求配置
 * @param {AbortController} controller 取消请求控制器
 * @returns {AbortController} 返回取消请求控制器
 */
export const addAbortMiddles = requestMiddleware((config: AxiosRequestConfig) => {
	const controller = new AbortController() // 创建取消请求控制器
	pendingMap.set(config.url as string, controller) // 设置取消请求控制器
	config.signal = controller.signal // 设置请求的信号，当调用 abort 时，会触发信号
	return config // 返回配置
})

// /**
//  * 删除取消请求中间件
//  * @param {AxiosRequestConfig} config 请求配置
//  */
// export const removeAbortMiddles = responseMiddleware((response: AxiosResponse) => {
// 	pendingMap.delete(response.config.url as string)
// 	return response
// })

/**
 * 取消请求
 * @param {AxiosRequestConfig} config 请求配置
 */
export const cancelRequest = (url: string) => {
	pendingMap.get(url)?.abort()
}

/**
 * 移除所有取消请求控制器
 */
export const removeAllAbortController = () => {
	pendingMap.clear() // 清空取消请求控制器列表
}
