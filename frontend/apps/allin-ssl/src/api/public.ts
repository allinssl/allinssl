// External library dependencies
import axios, { type AxiosResponse } from 'axios'

// Type imports
import type { useAxiosReturn } from '@baota/hooks/axios'
import type {
	AxiosResponseData,
	GetOverviewsParams,
	GetOverviewsResponse,
	loginCodeResponse,
	loginParams,
	loginResponse,
} from '@/types/public'

// Relative internal imports
import { useApi } from '@api/index'
import { storeToken, clearToken } from '@api/index'

/**
 * @description 登录
 * @param {loginParams} [params] 登录参数
 * @returns {useAxiosReturn<loginResponse, loginParams>} 登录操作的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const login = (params?: loginParams): useAxiosReturn<loginResponse, loginParams> => {
	const apiCall = useApi<loginResponse, loginParams>('/v1/login/sign', params)
	
	// 包装 execute 函数以存储 token
	const originalExecute = apiCall.execute
	apiCall.execute = async (...args: any[]) => {
		const result = await originalExecute(...args)
		if (result.data?.data?.token) {
			// 存储 JWT token
			storeToken(result.data.data.token, true)
		}
		return result
	}
	
	return apiCall
}

/**
 * @description 获取登录验证码
 * @returns {Promise<AxiosResponse<loginCodeResponse>>} 获取登录验证码的 Promise 对象。
 */
export const getLoginCode = (): Promise<AxiosResponse<loginCodeResponse>> => {
	return axios.get<loginCodeResponse>('/v1/login/get_code')
}

/**
 * @description 登出
 * @returns {useAxiosReturn<AxiosResponseData, unknown>} 登出操作的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const signOut = (): useAxiosReturn<AxiosResponseData, unknown> => {
	const apiCall = useApi<AxiosResponseData, unknown>('/v1/login/sign-out', {})
	
	// 包装 execute 函数以清除 token
	const originalExecute = apiCall.execute
	apiCall.execute = async (...args: any[]) => {
		const result = await originalExecute(...args)
		// 清除本地 token
		clearToken()
		return result
	}
	
	return apiCall
}

/**
 * @description 获取首页概览
 * @param {GetOverviewsParams} [params] 请求参数
 * @returns {useAxiosReturn<GetOverviewsResponse, GetOverviewsParams>} 获取首页概览数据的组合式 API 调用封装。包含响应数据、加载状态及执行函数。
 */
export const getOverviews = (params?: GetOverviewsParams): useAxiosReturn<GetOverviewsResponse, GetOverviewsParams> =>
	useApi<GetOverviewsResponse, GetOverviewsParams>('/v1/overview/get_overviews', params)
