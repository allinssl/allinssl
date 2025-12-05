/**
 * 域名安全页面控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { onMounted } from 'vue'
import { useDomainSecurityState } from './useStore'
import type { DomainSecurityTabKey } from './types.d'

/**
 * 域名安全页面控制器
 */
export function useController() {
	// 获取状态管理
	const {
		loading,
		activeTab,
		securityStatus,
		securityQuestionsList,
		verificationQuestions,
		fetchSecurityStatus,
		sendPhoneVerificationCode,
		verifyPhoneNumber,
		fetchSecurityQuestionsList,
		setupUserSecurityQuestions,
		updateSecuritySettings,
		fetchVerificationQuestions,
		verifySecurityAnswers,
	} = useDomainSecurityState()

	/**
	 * 切换标签页
	 * @param tab 标签页键值
	 */
	const switchTab = (tab: DomainSecurityTabKey) => {
		activeTab.value = tab
	}

	/**
	 * 初始化页面数据
	 */
	const initializeData = async () => {
		await fetchSecurityStatus()
	}

	/**
	 * 处理敏感操作限制开关切换
	 * @param value 开关状态
	 */
	const handleOperationProtectionToggle = async (value: boolean) => {
		await updateSecuritySettings({
			operation_protection: value,
		})
	}

	/**
	 * 处理全局转移锁开关切换
	 * @param value 开关状态
	 */
	const handleGlobalTransferLockToggle = async (value: boolean) => {
		await updateSecuritySettings({
			global_transfer_lock: value,
		})
	}

	/**
	 * 处理密保问题设置
	 * @param questions 密保问题数组
	 */
	const handleSetupSecurityQuestions = async (questions: any[]) => {
		await setupUserSecurityQuestions({ questions })
	}

	/**
	 * 处理手机验证码发送
	 * @param phone 手机号
	 */
	const handleSendPhoneCode = async (phone: string) => {
		await sendPhoneVerificationCode({ phone })
	}

	/**
	 * 处理手机号验证
	 * @param phone 手机号
	 * @param code 验证码
	 */
	const handleVerifyPhone = async (phone: string, code: string) => {
		return await verifyPhoneNumber({ phone, code })
	}

	/**
	 * 处理密保问题验证
	 * @param operationType 操作类型
	 * @param answers 答案数组
	 */
	const handleVerifySecurityQuestions = async (operationType: string, answers: any[]) => {
		return await verifySecurityAnswers({
			operation_type: operationType,
			answers,
		})
	}

	// 组件挂载时初始化数据
	onMounted(() => {
		initializeData()
	})

	return {
		// 状态
		loading,
		activeTab,
		securityStatus,
		securityQuestionsList,
		verificationQuestions,
		// 方法
		switchTab,
		initializeData,
		handleOperationProtectionToggle,
		handleGlobalTransferLockToggle,
		handleSetupSecurityQuestions,
		handleSendPhoneCode,
		handleVerifyPhone,
		handleVerifySecurityQuestions,
		fetchSecurityQuestionsList,
		fetchVerificationQuestions,
	}
}
