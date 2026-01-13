/**
 * 登录响应数据接口
 */
export interface LoginResponse {
	/** JWT token */
	message: string
	code: number
	status: boolean
	/** 用户信息 */
	data: null
}

/**
 * 用户信息接口
 */
export interface UserInfo {
	username: string
}

/**
 * 登录参数接口
 */
export interface LoginParams {
	code?: string
	username: string
	password: string
}

/**
 * 登录状态接口
 */
export interface LoginState {
	loading: boolean
	error: string | null
	user: UserInfo | null
	token: string | null
	username: string
	password: string
	rememberMe: boolean
	forgotPasswordRef: HTMLAnchorElement | null
}
