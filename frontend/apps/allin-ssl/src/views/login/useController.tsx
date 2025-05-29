// External Libraries
import md5 from 'crypto-js/md5'

// Type Imports
import type { LoginParams } from '@/types/login'

// Absolute Internal Imports
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'

// Relative Internal Imports
import { useStore } from './useStore'

/**
 * @file 登录控制器
 * @description 处理登录页面的业务逻辑，包括表单验证、密码加密、记住密码等功能
 */

// ==================== 工具函数 ====================
/**
 * @description md5 密码加密
 * @param password - 原始密码
 * @returns 加密后的密码
 */
const encryptPassword = (password: string): string => {
	return md5(`${password}_bt_all_in_ssl`).toString()
}

/**
 * @description 获取记住的登录数据
 * @returns 返回记住的登录数据，如果不存在则返回 null
 */
const getRememberData = (): LoginParams | null => {
	const loginDataInfo = localStorage.getItem('loginData')
	if (!loginDataInfo) return null
	return JSON.parse(loginDataInfo) as LoginParams // 添加类型断言
}

/**
 * @description 设置记住的登录数据
 * @param username - 用户名
 * @param password - 密码 (明文，存储前加密)
 */
const setRememberData = (username: string, password: string): void => {
	localStorage.setItem('loginData', JSON.stringify({ username, password }))
}

// ==================== Controller 类型定义 ====================
/**
 * Login Controller 返回的公开成员类型
 */
interface LoginControllerExposes extends ReturnType<typeof useStore> {
	// 继承自 useStore 的返回类型
	handleSubmit: (event: Event) => Promise<void>
	handleKeyup: (event: KeyboardEvent) => void
	handleLogin: (params: LoginParams) => Promise<void> // 覆盖 store 中的 handleLogin
	getRememberData: () => LoginParams | null
	setRememberData: (username: string, password: string) => void
}

// ==================== 控制器逻辑 ====================
/**
 * @description 登录控制器钩子
 * @returns 返回登录相关的状态和方法
 */
export const useController = (): LoginControllerExposes => {
	const store = useStore()
	const { handleError } = useError()
	// 从 store 中解构需要的状态和方法
	const { error, loginData, handleLogin: storeHandleLogin, rememberMe, checkMustCode, mustCode, handleGetCode } = store

	/**
	 * @description 处理登录业务逻辑，包括表单验证和密码加密
	 * @param params - 登录参数 (用户名、密码等)
	 */
	const handleLoginBusiness = async (params: LoginParams): Promise<void> => {
		// 表单验证
		if (!params.username.trim()) {
			error.value = $t('t_3_1744164839524') // 请输入用户名
			return
		}
		if (!params.password.trim()) {
			error.value = $t('t_4_1744164840458') // 请输入密码
			return
		}
		if (mustCode.value && !params.code?.trim()) {
			error.value = $t('t_25_1745289355721') // 请输入验证码
			return
		}

		try {
			const encryptedPassword = encryptPassword(params.password)
			await storeHandleLogin({ ...params, password: encryptedPassword }) // 调用 store 中的登录方法

			// 处理记住密码逻辑
			if (rememberMe.value && !error.value) {
				// 登录成功且勾选了记住密码
				setRememberData(params.username, params.password) // 存储原始密码以便回填
			} else if (error.value) {
				// 登录失败
				loginData.value.password = '' // 清空密码框
				if (mustCode.value) handleGetCode() // 刷新验证码
			} else if (!error.value && !rememberMe.value) {
				// 登录成功但未勾选记住密码
				localStorage.removeItem('loginData') // 清除已记住的密码
				// resetForm(); // 根据产品需求决定是否在登录成功后重置表单，通常不需要，因为会跳转
			}
		} catch (err) {
			handleError(err) // 处理未知错误
			if (mustCode.value) handleGetCode() // 发生错误时也刷新验证码
		}
	}

	/**
	 * @description 处理表单提交事件
	 * @param event - 表单提交事件对象
	 */
	const handleSubmit = async (event: Event): Promise<void> => {
		event.preventDefault()
		await handleLoginBusiness(loginData.value)
	}

	/**
	 * @description 处理键盘回车事件，触发表单提交
	 * @param event - 键盘事件对象
	 */
	const handleKeyup = (event: KeyboardEvent): void => {
		if (event.key === 'Enter') {
			handleSubmit(event as unknown as Event) // 类型转换以匹配 handleSubmit
		}
	}

	// ==================== 生命周期钩子 ====================
	const scope = effectScope()

	scope.run(() => {
		// 监听错误信息，5秒后自动清除
		watch(error, (newValue) => {
			if (newValue) {
				// 仅当有错误信息时启动计时器
				setTimeout(() => {
					error.value = ''
				}, 5000)
			}
		})

		onScopeDispose(() => {
			scope.stop()
		})
	})

	onMounted(() => {
		checkMustCode() // 初始化时检测是否必须验证码
		if (rememberMe.value) {
			const rememberedData = getRememberData() // 获取记住的登录数据
			if (rememberedData) {
				loginData.value.username = rememberedData.username
				loginData.value.password = rememberedData.password // 回填原始密码
			}
		}
	})

	// ==================== 返回值 ====================
	return {
		...store, // 暴露 store 中的所有属性和方法
		handleSubmit,
		handleKeyup,
		handleLogin: handleLoginBusiness, // 控制器封装的登录逻辑
		getRememberData,
		setRememberData,
	}
}
