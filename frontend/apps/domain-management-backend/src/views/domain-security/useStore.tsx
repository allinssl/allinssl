/**
 * 域名安全页面状态管理
 * 负责管理域名安全页面的数据、状态和操作
 */

import { ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import {
	getSecurityStatus,
	sendPhoneCode,
	verifyPhone,
	getSecurityQuestionsList,
	setupSecurityQuestions,
	updateProtectionSettings,
	getSecurityQuestionsForVerification,
	verifySecurityQuestions,
} from '@/api/security'

import type {
	SecurityStatusData,
	SecurityQuestionsListData,
	SecurityQuestionItem,
	SetupSecurityQuestionsRequest,
	UpdateProtectionSettingsRequest,
	VerifySecurityQuestionsRequest,
	SendPhoneCodeRequest,
	VerifyPhoneRequest,
	DomainSecurityTabKey,
} from './types.d'
import { executeApiWithSecurityVerification } from '@/public/dialog'

const message = useMessage()
const { handleError } = useError()

/**
 * 域名安全页面状态Store
 */
export const useDomainSecurityStore = defineStore(
	'domain-security-store',
	() => {
		// -------------------- 状态定义 --------------------

		/** 页面加载状态 */
		const loading = ref(false)

		/** 当前激活的标签页 */
		const activeTab = ref<DomainSecurityTabKey>('basic-security')

		/** 安全状态数据 */
		const securityStatus = ref<SecurityStatusData>({
			global_transfer_lock: false,
			has_security_questions: false,
			operation_protection: false,
			phone: '',
			phone_verified: false,
			questions: '',
		})

		/** 密保问题列表 */
		const securityQuestionsList = ref<Record<string, string>>({})

		/** 验证用密保问题 */
		const verificationQuestions = ref<SecurityQuestionItem[]>([])

		// -------------------- 方法定义 --------------------

		/**
		 * 获取安全状态
		 */
		const fetchSecurityStatus = async () => {
			try {
				loading.value = true
				const { fetch, data } = getSecurityStatus()

				await fetch()
				if (data.value?.data) {
					securityStatus.value = data.value.data
				}
			} catch (error) {
				handleError(error)
			} finally {
				loading.value = false
			}
		}

		/**
		 * 发送手机验证码
		 */
		const sendPhoneVerificationCode = async (params: SendPhoneCodeRequest) => {
			try {
				const { fetch, message } = sendPhoneCode(params)
				message.value = true
				await fetch()
			} catch (error) {
				handleError(error)
				throw error
			}
		}

		/**
		 * 验证手机号
		 */
		const verifyPhoneNumber = async (params: VerifyPhoneRequest) => {
			try {
				const { fetch, data, message } = verifyPhone(params)
				message.value = true
				await fetch()
				return data.value.status
			} catch (error) {
				handleError(error)
				throw error
			}
		}

		/**
		 * 获取密保问题列表
		 */
		const fetchSecurityQuestionsList = async () => {
			try {
				const { fetch, data } = getSecurityQuestionsList()
				await fetch()
				if (data.value?.data?.questions) {
					securityQuestionsList.value = data.value.data.questions
				}
			} catch (error) {
				handleError(error)
			}
		}

		/**
		 * 设置密保问题
		 */
		const setupUserSecurityQuestions = async (params: SetupSecurityQuestionsRequest) => {
			try {
				const { fetch, message } = setupSecurityQuestions(params)
				message.value = true
				await fetch()
				// 重新获取安全状态
				await fetchSecurityStatus()
			} catch (error) {
				handleError(error)
				throw error
			}
		}

		/**
		 * 更新安全设置
		 */
		const updateSecuritySettings = async (params: UpdateProtectionSettingsRequest) => {
			await executeApiWithSecurityVerification(updateProtectionSettings as any, params, {
				showMessage: true,
			})
			// 重新获取安全状态
			await fetchSecurityStatus()
		}

		/**
		 * 获取验证用密保问题
		 */
		const fetchVerificationQuestions = async () => {
			try {
				const { fetch, data } = getSecurityQuestionsForVerification()
				await fetch()
				if (data.value?.data?.questions) {
					verificationQuestions.value = data.value.data.questions
				}
			} catch (error) {
				handleError(error)
			}
		}

		/**
		 * 验证密保问题答案
		 */
		const verifySecurityAnswers = async (params: VerifySecurityQuestionsRequest) => {
			try {
				const { fetch, data, message } = verifySecurityQuestions(params)
				message.value = true
				await fetch()
				if (data.value?.data) {
					return data.value.data
				}
			} catch (error) {
				handleError(error)
				throw error
			}
		}

		return {
			// 状态
			loading,
			activeTab,
			securityStatus,
			securityQuestionsList,
			verificationQuestions,
			// 方法
			fetchSecurityStatus,
			sendPhoneVerificationCode,
			verifyPhoneNumber,
			fetchSecurityQuestionsList,
			setupUserSecurityQuestions,
			updateSecuritySettings,
			fetchVerificationQuestions,
			verifySecurityAnswers,
		}
	},
	{
		// 配置持久化
		persist: true,
	},
)

export const useDomainSecurityState = () => {
	const store = useDomainSecurityStore()
	return { ...store, ...storeToRefs(store) }
}
