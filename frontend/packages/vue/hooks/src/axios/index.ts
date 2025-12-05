import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { ref, shallowRef, computed, watch, effectScope, onScopeDispose } from 'vue'
import type { Ref, ShallowRef, ComputedRef } from 'vue'
import { useLoadingMask, useDialog, useMessage } from '@baota/naive-ui/hooks'
import { HttpClient, HttpClientConfig, type Middleware } from './model'
import { useError } from '../error'
import { cancelRequest, removeAllAbortController } from './model/axios-cancel'

import type { CustomDialogOptions } from '@baota/naive-ui/types/dialog'
import type { LoadingMaskOptions } from '@baota/naive-ui/types/loadingMask'

export type HttpStatusCode = 200 | 201 | 204 | 400 | 401 | 403 | 404 | 500 | 502 | 504

/**
 * @description API响应类型
 */
export interface ApiResponse<T = unknown> {
	status: boolean
	message: string
	code: HttpStatusCode
	data: T
}

export interface useAxiosReturn<T, Z> {
	/** 加载遮罩 */
	loadingMask: Ref<{ status: boolean } & LoadingMaskOptions>
	/** 消息提示 */
	message: Ref<boolean>
	/** 确认框 */
	dialog: Ref<{ status: boolean } & CustomDialogOptions>
	/** 响应式状态 */
	loading: Ref<boolean>
	/** 错误 */
	error: ShallowRef<Error | null | string>
	/** 响应 */
	response: ShallowRef<AxiosResponse<T> | null>
	/** 响应数据 */
	data: Ref<T>
	/** 默认数据 */
	defaultData: Ref<T>
	/** HTTP状态码 */
	statusCode: ComputedRef<HttpStatusCode | null>
	/** 是否被中断 */
	aborted: Ref<boolean>
	/** URL和参数 */
	urlRef: Ref<string>
	/** 请求参数 */
	paramsRef: Ref<Z>
	/** 执行请求 */
	execute: (url: string, params?: Z) => Promise<T>
	/** 设置参数 */
	setParams: (params: Z) => Promise<T>
	/** 设置URL */
	setUrl: (url: string, params?: Z) => Promise<T>
	/** 取消请求 */
	cancel: (url: string) => void
	/** 取消所有请求 */
	cancelAll: () => void
	/** 发起请求 */
	fetch: (params?: Z) => Promise<T>
}

/**
 * @description axios hooks
 * @param instance HTTP客户端实例
 * @param config 配置项
 * @returns 响应式对象和方法
 */
const useAxios = <T = unknown, Z = Record<string, unknown>>(instance: HttpClient): useAxiosReturn<T, Z> => {
	const { open, close, update } = useLoadingMask() // 加载遮罩

	// 请求状态
	const loadingMaskRefs = ref<{ status: boolean } & LoadingMaskOptions>({
		status: false, // 是否启用遮罩过渡
		text: '正在处理，请稍后...', // 加载文本
	})

	// 响应数据
	const dialogRefs = ref<{ status: boolean } & CustomDialogOptions>({
		status: false, // 是否启动确认框
	}) // 消息提示

	const loadingRef = ref(false) // 是否正在加载
	const messageRef = ref(false) // 消息提示
	const loadingInstance = shallowRef<unknown>(null) // 加载实例
	const config = ref<AxiosRequestConfig>({}) // 配置项

	// 响应数据
	const errorRef = shallowRef<Error | null | string>(null) // 错误
	const response = shallowRef<AxiosResponse<T> | null>(null) // 原始响应
	const statusCode = computed<HttpStatusCode | null>(() => (response.value?.status as HttpStatusCode) || null) // HTTP状态码
	const dataRef = ref<T>({} as T) // 处理后的数据
	const defaultData = ref<T>({} as T) // 默认数据

	// 请求参数
	const urlRef = ref('') // url
	const paramsRef = ref<Z>({} as Z) // 参数
	// const replayRef = ref({ url: '', params: {} as Z }) // 重放请求
	const aborted = ref(false) // 是否被中断

	// 控制加载遮罩
	const showLoadingMask = () => {
		if (loadingMaskRefs.value.status && !loadingInstance.value) {
			update({ ...loadingMaskRefs.value }) // 更新加载文本
			open() // 打开加载遮罩
		}
	}

	// 关闭加载遮罩
	const closeLoadingMask = () => {
		if (loadingInstance.value) {
			close() // 关闭加载遮罩
			loadingInstance.value = null
		}
	}

	// 显示响应消息
	const showResponseMessage = () => {
		console.log('dataRef.value', dataRef.value)
		if (!messageRef.value || !dataRef.value) return
		if (dataRef.value && typeof dataRef.value === 'object') {
			if ('status' in dataRef.value && ('message' in dataRef.value || 'msg' in dataRef.value)) {
				const { request } = useMessage() // 消息提示
				const { status, message, msg } = dataRef.value
				if (message || msg) request({ status, message: message || msg })
			}
		}
	}

	// 处理请求错误
	const handleApiError = (err: AxiosError) => {
		const { handleError } = useError()
		if (typeof err === 'boolean') return
		aborted.value = (err as Error)?.name === 'AbortError' || false // 是否被中断
		// 检查是否为服务器错误
		if (err.status != 200 && err.status != 404 && err?.response) {
			const { message } = err.response?.data as {
				status: number
				message: string
			}
			return handleError(new Error(message))
		} else {
			handleError(err)
		}
		return err
	}

	/**
	 * 执行请求
	 * @param {string} url 请求地址
	 * @param  params 请求参数
	 * @returns 响应数据
	 */
	const execute = async (url: string, params?: Z) => {
		// 避免空URL请求
		if (!url.trim()) return

		try {
			// 重置状态
			errorRef.value = null
			aborted.value = false
			loadingRef.value = true

			// 保留请求信息
			urlRef.value = url
			paramsRef.value = params || {}

			// 是否显示提示框
			if (dialogRefs.value.status) {
				const { create } = useDialog()
				await create({
					type: 'info',
					...dialogRefs.value,
				})
			}

			// 显示加载遮罩
			if (loadingMaskRefs.value.status) showLoadingMask()
			// 执行请求
			const res = await instance.post<T>(url, params as Record<string, unknown>, config.value)
			// 保存响应
			response.value = res
			// 处理响应数据
			if (res.data) dataRef.value = { ...defaultData.value, ...res.data }
			// 显示响应消息
			if (messageRef.value) showResponseMessage()
			return res.data
		} catch (err: unknown) {
			handleApiError(err as AxiosError)
		} finally {
			// 关闭加载状态
			loadingRef.value = false
			// 关闭加载遮罩
			if (loadingMaskRefs.value.text) closeLoadingMask()
		}
	}

	/**
	 * 设置请求参数，并执行请求
	 * @param params 请求参数
	 */
	const setParams = (params: Z) => {
		paramsRef.value = params
		return execute(urlRef.value, params)
	}
	/**
	 * 	设置配置项
	 * @param config 配置项
	 */
	const setConfig = (requestConfig: AxiosRequestConfig) => {
		config.value = requestConfig
	}

	/**
	 * 设置请求地址，并执行请求
	 * @param url 请求地址
	 * @param params 请求参数
	 */
	const setUrl = (url: string, params: Z) => {
		urlRef.value = url
		paramsRef.value = params || {}
		return execute(url, paramsRef.value)
	}

	/**
	 * 取消特定请求
	 * @param url 请求地址
	 */
	const cancel = (url: string) => {
		aborted.value = true
		return cancelRequest(url)
	}

	/**
	 * 取消所有请求
	 */
	const cancelAll = () => {
		aborted.value = true
		return removeAllAbortController()
	}

	/**
	 * 重放上一次请求
	 */
	const fetch = (params?: Z) => {
		if (!urlRef.value) return
		return execute(urlRef.value, params || paramsRef.value)
	}

	const scope = effectScope()
	scope.run(() => {
		// 监听 loadingMask 变化
		watch(loadingMaskRefs, (newVal) => {
			if (newVal && loadingRef.value) {
				showLoadingMask()
			} else if (!newVal) {
				closeLoadingMask()
			}
		})
		onScopeDispose(() => {
			scope.stop()
		})
	})

	// 封装响应式状态
	const state = {
		// 集成组件状态
		loadingMask: loadingMaskRefs,
		dialog: dialogRefs,
		message: messageRef,

		// 响应式状态

		loading: loadingRef,
		error: errorRef,
		response,
		data: dataRef,
		defaultData,
		statusCode,
		aborted,
		urlRef,
		paramsRef,
	}

	// 封装方法
	const methods = {
		execute,
		setParams,
		setUrl,
		setConfig,
		cancel,
		cancelAll,
		fetch,
	}

	return <useAxiosReturn<T, Z>>{
		...state,
		...methods,
	}
}

export { HttpClient, useAxios, type Middleware }
