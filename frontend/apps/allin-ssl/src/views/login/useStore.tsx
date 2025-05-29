/**
 * @file 登录模块状态管理
 * @description 负责处理登录相关的状态管理，包括用户认证、token管理和登录状态维护
 */
// External Libraries
import { useMessage } from '@baota/naive-ui/hooks'

// Type Imports
import type { UserInfo, LoginParams } from '@/types/login' // 假设 LoginData 在 types/login 中定义或将在此处定义

// Absolute Internal Imports
import { getLoginCode, login } from '@api/public'
import { getCookie } from '@baota/utils/browser'
import { useError } from '@baota/hooks/error'
import { ShallowRef } from 'vue'

/** 消息提示 */
const { success } = useMessage()
const { handleError } = useError()

// ==================== Store 类型定义 ====================
/**
 * Store 返回的公开成员类型
 */
interface LoginStoreExposes {
	loading: Ref<boolean>
	codeImg: Ref<string>
	error: ShallowRef<Error | string | null>
	user: Ref<UserInfo | null>
	loginData: Ref<LoginParams> // 使用 LoginData 接口
	rememberMe: Ref<boolean>
	forgotPasswordRef: Ref<HTMLAnchorElement | null>
	mustCode: Ref<boolean>
	handleLogin: (params: { username: string; password: string; code?: string }) => Promise<void>
	handleLogout: () => void
	handleGetCode: () => Promise<void>
	checkMustCode: () => void
	resetForm: () => void
	clearToken: () => void
}

// ==================== Store 定义 ====================
export const useLoginStore = defineStore('login-store', (): LoginStoreExposes => {
	// -------------------- 状态定义 --------------------
	/** 认证相关状态 */
	const user = ref<UserInfo | null>(null)
	const codeImg = ref('')
	const useToken = useLocalStorage<string>('login-token', '')
	const mustCode = ref<boolean>(false) // 是否必须验证码

	/** 表单相关状态 */
	const loginData = ref<LoginParams>({
		username: '',
		password: '',
		code: '',
	})

	const rememberMeRef = useLocalStorage<boolean>('remember-me', false)
	const forgotPasswordRef = ref<HTMLAnchorElement | null>(null)

	// 初始化登录请求
	const { fetch, error, data, message, loading } = login()
	// -------------------- 工具方法 --------------------

	/**
	 * 重置表单状态
	 */
	const resetForm = (): void => {
		loginData.value.username = ''
		loginData.value.password = ''
		rememberMeRef.value = false
		error.value = null
	}

	/**
	 * 清除token
	 */
	const clearToken = (): void => {
		useToken.value = null
	}

	// -------------------- 核心业务逻辑 --------------------
	/**
	 * 登录处理
	 * @param params - 包含用户名、密码和可选验证码的对象
	 * @returns Promise，操作完成时 resolve
	 */
	const handleLogin = async (params: { username: string; password: string; code?: string }): Promise<void> => {
		try {
			error.value = null // 清除之前的错误信息
			message.value = true // 触发消息提示 (假设这是控制 NMessage 的开关)
			// 发送登录请求
			await fetch(params)
			const { status } = data.value
			// 处理登录响应
			if (status) {
				success('登录成功，正在跳转中...')
				// 登录成功，跳转到服务器页面
				setTimeout(() => (location.href = '/'), 1000)
			} else {
				throw new Error(data.value.message)
			}
			checkMustCode()
		} catch (err: unknown) {
			error.value = (err as Error).message
			checkMustCode()
		}
	}

	/**
	 * 登出处理
	 * 清除用户信息和token，并重定向到登录页
	 */
	const handleLogout = (): void => {
		// 清除所有状态
		user.value = null
		useToken.value = null
		resetForm()
		location.href = '/login'
	}

	/**
	 * 获取登录验证码
	 * @returns Promise，操作完成时 resolve
	 */
	const handleGetCode = async (): Promise<void> => {
		try {
			const { data: codeData } = await getLoginCode() // 重命名 data 避免与外部 data 冲突
			codeImg.value = codeData.data
		} catch (err) {
			// 明确捕获的 error 类型
			handleError(err)
		}
	}

	/**
	 *  检测是否必须验证码
	 */
	const checkMustCode = (): void => {
		const res = getCookie('must_code', false)
		mustCode.value = Number(res) === 1
		if (mustCode.value) handleGetCode()
	}

	// -------------------- Store 导出 --------------------
	return {
		// 状态导出
		loading,
		codeImg,
		error,
		user,
		loginData,
		rememberMe: rememberMeRef,
		forgotPasswordRef,
		mustCode,

		// 方法导出
		handleLogin,
		handleLogout,
		handleGetCode,
		checkMustCode,
		resetForm,
		clearToken,
	}
})

/**
 * 登录Store Hook
 * @returns 登录Store的响应式状态和方法
 */
export const useStore = () => {
	const store = useLoginStore()
	return { ...store, ...storeToRefs(store) } // 确保返回类型与 LoginStoreExposes 兼容
}
