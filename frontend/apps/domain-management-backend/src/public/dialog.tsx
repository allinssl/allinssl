import { ref } from 'vue'
import { useModal } from '@baota/naive-ui/hooks'
import type { SecurityQuestionItem } from '@/views/domain-security/types.d'
import VerifySecurityQuestions from '@/components/global/VerifySecurityQuestions'
import { updateDnsRecord } from '@/api/dns'
import type { UpdateDnsRecordRequest } from '@/types/dns'
import { useError } from '@baota/hooks/error'

const questionsModal = ref<any>()
const { handleError } = useError()

export function closeQuestionsModal() {
	if (questionsModal.value) {
		questionsModal.value.close()
	}
}
/**
 * 打开问题验证弹窗
 * @param questions 密保问题列表
 * @param onSuccess 验证成功回调函数，接收security_token参数
 * @param operationType 操作类型，默认为'operation_protection'
 */
export function openSecurityQuestionsModal(
	questions: SecurityQuestionItem | SecurityQuestionItem[],
	onSuccess?: (securityToken: string) => void,
	operationType?: string,
) {
	// 确保 questions 是数组格式
	const questionList = Array.isArray(questions) ? questions : [questions]

	// useModal 直接返回 modal 实例，不需要赋值给 ref
	questionsModal.value = useModal({
		title: '验证密保问题',
		area: 520,
		component: VerifySecurityQuestions,
		componentProps: {
			questions: questionList,
			operationType: operationType || 'operation_protection',
			onSuccess: onSuccess,
			onCancel: () => {
				closeQuestionsModal()
			},
		},
		footer: false,
		onClose: () => {
			questionsModal.value.close()
		},
	})
}

/**
 * 通用的API请求封装，支持密保验证流程
 * @param apiFunction API函数，返回包含fetch、data、message、setConfig的对象
 * @param params API请求参数
 * @param options 配置选项
 * @returns Promise<any> 请求结果
 */
export async function executeApiWithSecurityVerification<T = any, P = any>(
	apiFunction: (params: P) => {
		fetch: () => Promise<void>
		data: { value: any }
		message: { value: boolean }
		setConfig: (config: any) => void
	},
	params: P,
	options: {
		/** 是否显示成功消息 */
		showMessage?: boolean
		/** 操作类型，用于密保验证 */
		operationType?: string
		/** 加载状态控制函数 */
		setLoading?: (loading: boolean) => void
		/** 自定义错误处理函数 */
		onError?: (error: any) => void
		/** 需要密保验证的错误码，默认为3005 */
		securityVerificationCode?: number
	} = {},
): Promise<T> {
	const {
		showMessage = true,
		operationType = 'operation_protection',
		setLoading,
		onError,
		securityVerificationCode = 3005,
	} = options

	// 设置加载状态
	setLoading?.(true)

	try {
		const { fetch, data, message, setConfig } = apiFunction(params)

		// 设置是否显示消息
		message.value = showMessage

		// 发起初始请求
		await fetch()
		console.log(data.value, 'executeApiWithSecurityVerification')
		// 检查是否需要密保验证
		if (data.value?.code === securityVerificationCode) {
			// 返回Promise，等待密保验证完成
			return new Promise((resolve, reject) => {
				// 打开密保验证弹窗，传入成功回调
				openSecurityQuestionsModal(
					data.value?.data?.questions,
					async (securityToken: string) => {
						try {
							console.log('收到security_token:', securityToken)
							// 使用获取到的token更新请求头配置
							setConfig({
								headers: {
									'Security-Token': securityToken,
								},
							})
							// 重新发起请求
							await fetch()
							resolve(data.value)
						} catch (error) {
							if (onError) {
								onError(error)
							} else {
								handleError(error)
							}
							reject(error)
						}
					},
					operationType,
				)
			})
		}

		return data.value
	} catch (err) {
		if (onError) {
			onError(err)
		} else {
			handleError(err)
		}
		return false as T
	} finally {
		// 重置加载状态
		setLoading?.(false)
	}
}
