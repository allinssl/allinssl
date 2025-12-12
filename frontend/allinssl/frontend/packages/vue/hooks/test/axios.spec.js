import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { useAxios, MiddlewareStage } from '../src/axios'
import axios from 'axios'
// 模拟axios
vi.mock('axios', () => {
	return {
		default: {
			create: vi.fn(() => ({
				interceptors: {
					request: {
						use: vi.fn(),
						eject: vi.fn(),
					},
					response: {
						use: vi.fn(),
						eject: vi.fn(),
					},
				},
				request: vi.fn(),
			})),
			isCancel: vi.fn((error) => error && error.__CANCEL__),
			CancelToken: {
				source: vi.fn(() => ({
					token: 'mock-token',
					cancel: vi.fn(),
				})),
			},
		},
	}
})
describe('useAxios', () => {
	let mockResponse
	beforeEach(() => {
		vi.clearAllMocks()
		mockResponse = {
			data: { message: 'success' },
			status: 200,
			statusText: 'OK',
			headers: {},
			config: {},
		}
		// 设置axios.request的模拟实现
		axios.create().request.mockImplementation(() => Promise.resolve(mockResponse))
	})
	afterEach(() => {
		vi.clearAllMocks()
	})
	it('应该返回正确的响应数据', async () => {
		const { data, error, loading, request } = useAxios()
		expect(loading.value).toBe(false)
		expect(data.value).toBe(null)
		expect(error.value).toBe(null)
		const promise = request({ url: '/test' })
		expect(loading.value).toBe(true)
		await promise
		expect(loading.value).toBe(false)
		expect(data.value).toEqual({ message: 'success' })
		expect(error.value).toBe(null)
		expect(axios.create().request).toHaveBeenCalledWith(expect.objectContaining({ url: '/test' }))
	})
	it('当请求失败时应该设置错误信息', async () => {
		const mockError = new Error('Request failed')
		axios.create().request.mockImplementation(() => Promise.reject(mockError))
		const { data, error, loading, request } = useAxios()
		try {
			await request({ url: '/test' })
		} catch (e) {
			// 预期抛出错误
		}
		expect(loading.value).toBe(false)
		expect(data.value).toBe(null)
		expect(error.value).toBe(mockError)
	})
	it('应该支持请求重试', async () => {
		// 前两次请求失败，第三次成功
		axios
			.create()
			.request.mockImplementationOnce(() => Promise.reject(new Error('Retry 1')))
			.mockImplementationOnce(() => Promise.reject(new Error('Retry 2')))
			.mockImplementationOnce(() => Promise.resolve(mockResponse))
		const { data, request } = useAxios()
		await request({
			url: '/test',
			retry: true,
			retryTimes: 3,
		})
		expect(axios.create().request).toHaveBeenCalledTimes(3)
		expect(data.value).toEqual({ message: 'success' })
	})
	it('应该能够取消请求', async () => {
		// 模拟取消功能
		const cancelError = new Error('Request canceled')
		cancelError.__CANCEL__ = true
		const sourceCancel = axios.CancelToken.source().cancel
		sourceCancel.mockImplementation(() => {
			axios.create().request.mockImplementation(() => Promise.reject(cancelError))
		})
		const { loading, request, cancel } = useAxios()
		const requestPromise = request({ url: '/test', requestId: 'test-request' })
		cancel('test-request')
		try {
			await requestPromise
		} catch (e) {
			// 预期抛出错误
		}
		expect(loading.value).toBe(false)
		expect(sourceCancel).toHaveBeenCalled()
	})
	it('应该支持中间件机制', async () => {
		const requestMiddleware = vi.fn()
		const responseMiddleware = vi.fn()
		const { request, use } = useAxios()
		// 添加请求中间件
		use({
			id: 'request-middleware',
			stage: MiddlewareStage.REQUEST,
			handler: requestMiddleware,
		})
		// 添加响应中间件
		use({
			id: 'response-middleware',
			stage: MiddlewareStage.RESPONSE,
			handler: responseMiddleware,
		})
		await request({ url: '/test' })
		expect(requestMiddleware).toHaveBeenCalled()
		expect(responseMiddleware).toHaveBeenCalled()
	})
	it('应该缓存请求结果', async () => {
		const { request, clearCache } = useAxios()
		await request({ url: '/cached', cache: true })
		await request({ url: '/cached', cache: true })
		// 由于缓存，实际axios请求应该只执行一次
		expect(axios.create().request).toHaveBeenCalledTimes(1)
		// 清除缓存后再次请求应该执行新的请求
		clearCache()
		await request({ url: '/cached', cache: true })
		expect(axios.create().request).toHaveBeenCalledTimes(2)
	})
	it('应该支持自定义实例配置', async () => {
		const customConfig = {
			baseURL: 'https://api.example.com',
			timeout: 5000,
			headers: {
				'Content-Type': 'application/json',
				'X-Custom-Header': 'Custom-Value',
			},
		}
		const { request } = useAxios({
			options: customConfig,
		})
		await request({ url: '/test' })
		// 验证创建实例时使用了自定义配置
		expect(axios.create).toHaveBeenCalledWith(customConfig)
	})
	it('应该支持请求级别的配置覆盖实例配置', async () => {
		const { request } = useAxios({
			options: {
				baseURL: 'https://api.example.com',
				timeout: 5000,
			},
		})
		await request({
			url: '/test',
			timeout: 10000, // 覆盖实例的timeout
			headers: {
				'X-Request-Header': 'Request-Value',
			},
		})
		// 验证请求参数包含覆盖的配置
		expect(axios.create().request).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/test',
				timeout: 10000,
				headers: {
					'X-Request-Header': 'Request-Value',
				},
			}),
		)
	})
	it('应该支持删除中间件', async () => {
		const requestMiddleware = vi.fn()
		const { request, use, eject } = useAxios()
		// 添加中间件
		use({
			id: 'test-middleware',
			stage: MiddlewareStage.REQUEST,
			handler: requestMiddleware,
		})
		// 删除中间件
		eject('test-middleware')
		await request({ url: '/test' })
		// 由于中间件已被删除，不应该被调用
		expect(requestMiddleware).not.toHaveBeenCalled()
	})
	it('应该支持请求前的数据转换', async () => {
		const { request, use } = useAxios()
		// 添加请求转换中间件
		use({
			id: 'transform-request',
			stage: MiddlewareStage.REQUEST,
			handler: (config) => {
				if (config.data) {
					config.data = { ...config.data, transformed: true }
				}
				return config
			},
		})
		await request({
			url: '/test',
			method: 'post',
			data: { original: true },
		})
		// 验证请求数据被转换
		expect(axios.create().request).toHaveBeenCalledWith(
			expect.objectContaining({
				data: { original: true, transformed: true },
			}),
		)
	})
	it('应该支持响应数据转换', async () => {
		const { data, request, use } = useAxios()
		// 添加响应转换中间件
		use({
			id: 'transform-response',
			stage: MiddlewareStage.RESPONSE,
			handler: (response) => {
				response.data = { ...response.data, transformed: true }
				return response
			},
		})
		await request({ url: '/test' })
		// 验证响应数据被转换
		expect(data.value).toEqual({
			message: 'success',
			transformed: true,
		})
	})
	it('应该支持响应错误处理中间件', async () => {
		const mockError = new Error('Request failed')
		axios.create().request.mockImplementation(() => Promise.reject(mockError))
		const errorHandler = vi.fn().mockImplementation(() => {
			// 将错误转换为成功响应
			return {
				data: { recovered: true },
				status: 200,
				statusText: 'OK',
				headers: {},
				config: {},
			}
		})
		const { data, error, request, use } = useAxios()
		// 添加错误处理中间件
		use({
			id: 'error-handler',
			stage: MiddlewareStage.ERROR,
			handler: errorHandler,
		})
		await request({ url: '/test' })
		// 验证错误被处理且转换为成功响应
		expect(errorHandler).toHaveBeenCalled()
		expect(data.value).toEqual({ recovered: true })
		expect(error.value).toBe(null)
	})
	it('应该支持请求防抖', async () => {
		vi.useFakeTimers()
		const { request } = useAxios()
		// 短时间内发起多个相同请求
		request({ url: '/debounced', debounce: true, debounceTime: 100 })
		request({ url: '/debounced', debounce: true, debounceTime: 100 })
		request({ url: '/debounced', debounce: true, debounceTime: 100 })
		// 前进100ms，触发防抖后的请求
		vi.advanceTimersByTime(100)
		await Promise.resolve() // 等待微任务队列
		// 仅发送一次请求
		expect(axios.create().request).toHaveBeenCalledTimes(1)
		vi.useRealTimers()
	})
	it('应该支持请求节流', async () => {
		vi.useFakeTimers()
		const { request } = useAxios()
		// 立即执行第一个请求
		request({ url: '/throttled', throttle: true, throttleTime: 100 })
		// 这些请求应该被忽略
		request({ url: '/throttled', throttle: true, throttleTime: 100 })
		request({ url: '/throttled', throttle: true, throttleTime: 100 })
		// 验证立即执行了第一个请求
		expect(axios.create().request).toHaveBeenCalledTimes(1)
		// 重置模拟
		axios.create().request.mockClear()
		// 前进100ms，节流时间结束
		vi.advanceTimersByTime(100)
		// 再次发送请求
		request({ url: '/throttled', throttle: true, throttleTime: 100 })
		// 验证发送了新的请求
		expect(axios.create().request).toHaveBeenCalledTimes(1)
		vi.useRealTimers()
	})
	it('应该支持同时处理多个并发请求', async () => {
		const { loading, request } = useAxios()
		// 发起多个请求
		const promise1 = request({ url: '/request1' })
		const promise2 = request({ url: '/request2' })
		const promise3 = request({ url: '/request3' })
		expect(loading.value).toBe(true)
		// 等待所有请求完成
		await Promise.all([promise1, promise2, promise3])
		expect(loading.value).toBe(false)
		expect(axios.create().request).toHaveBeenCalledTimes(3)
	})
	it('应该支持通过配置禁用全局loading状态', async () => {
		const { loading, request } = useAxios({
			options: {
				useGlobalLoading: false,
			},
		})
		// 初始状态
		expect(loading.value).toBe(false)
		// 发起请求
		const promise = request({ url: '/test' })
		// loading状态应该仍为false
		expect(loading.value).toBe(false)
		await promise
		expect(loading.value).toBe(false)
	})
	it('应该支持通过URL参数进行请求', async () => {
		const { request } = useAxios()
		await request({
			url: '/test',
			params: {
				id: 123,
				filter: 'active',
				sort: 'desc',
			},
		})
		// 验证请求包含参数
		expect(axios.create().request).toHaveBeenCalledWith(
			expect.objectContaining({
				url: '/test',
				params: { id: 123, filter: 'active', sort: 'desc' },
			}),
		)
	})
	it('应该支持自定义请求头', async () => {
		const { request } = useAxios()
		await request({
			url: '/test',
			headers: {
				Authorization: 'Bearer token123',
				'Accept-Language': 'zh-CN',
			},
		})
		// 验证请求包含自定义头
		expect(axios.create().request).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: {
					Authorization: 'Bearer token123',
					'Accept-Language': 'zh-CN',
				},
			}),
		)
	})
	it('应该支持不同的响应类型', async () => {
		mockResponse.data = 'blob-data'
		const { data, request } = useAxios()
		await request({
			url: '/download',
			responseType: 'blob',
		})
		// 验证请求参数
		expect(axios.create().request).toHaveBeenCalledWith(
			expect.objectContaining({
				responseType: 'blob',
			}),
		)
		// 验证获取了正确的响应
		expect(data.value).toBe('blob-data')
	})
	it('应该支持请求超时配置', async () => {
		const mockTimeoutError = new Error('timeout')
		mockTimeoutError.code = 'ECONNABORTED'
		axios.create().request.mockImplementation(() => Promise.reject(mockTimeoutError))
		const { error, request } = useAxios()
		try {
			await request({
				url: '/test',
				timeout: 1000,
			})
		} catch (e) {
			// 预期抛出错误
		}
		// 验证请求参数
		expect(axios.create().request).toHaveBeenCalledWith(
			expect.objectContaining({
				timeout: 1000,
			}),
		)
		// 验证错误状态
		expect(error.value).toBe(mockTimeoutError)
	})
	it('应该支持动态更新请求选项', async () => {
		const defaultOptions = ref({
			baseURL: 'https://api.example.com',
			headers: {
				'Content-Type': 'application/json',
			},
		})
		const { request } = useAxios({
			options: defaultOptions,
		})
		// 发起第一个请求
		await request({ url: '/test1' })
		// 验证使用了初始配置
		expect(axios.create).toHaveBeenCalledWith(defaultOptions.value)
		// 更新配置
		defaultOptions.value = {
			...defaultOptions.value,
			baseURL: 'https://api2.example.com',
			timeout: 3000,
		}
		await nextTick()
		// 发起第二个请求
		await request({ url: '/test2' })
		// 验证使用了更新后的配置
		expect(axios.create).toHaveBeenCalledWith(defaultOptions.value)
	})
})
//# sourceMappingURL=axios.spec.js.map
