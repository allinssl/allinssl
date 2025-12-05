/**
 * 安全验证问题组件
 * 用于验证用户的密保问题答案
 */
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NForm, NFormItem, NInput, NButton, NSpace, NText } from 'naive-ui'
import { useMessage } from '@baota/naive-ui/hooks'
import { verifySecurityQuestions } from '@/api/security'
import { useDomainSecurityState } from '@/views/domain-security/useStore'
import type { SecurityQuestionItem, VerifySecurityQuestionsResponse } from '@/views/domain-security/types.d'
import { closeQuestionsModal } from '@/public/dialog'

// Props 接口定义
interface Props {
	/** 密保问题数组，格式为[{question_id: 3, question_text: "您的出生地是哪里?"}] */
	questions: SecurityQuestionItem[]
	/** 操作类型，用于接口调用，默认为 'dns_modify' */
	operationType?: string
	/** 验证成功回调，传递security_token */
	onSuccess?: (securityToken: string) => void
	/** 取消回调 */
	onCancel?: () => void
}
const message = useMessage()

export default defineComponent({
	name: 'VerifySecurityQuestions',
	props: {
		questions: {
			type: Array as () => SecurityQuestionItem[],
			required: true,
		},
		operationType: {
			type: String,
			default: 'operation_protection',
		},
		onSuccess: {
			type: Function as unknown as () => (securityToken: string) => void,
			default: () => () => {},
		},
		onCancel: {
			type: Function as unknown as () => () => void,
			default: () => () => {},
		},
	},
	setup(props: Props) {
		// 组合式API
		const router = useRouter()
		const { activeTab } = useDomainSecurityState()

		// 响应式数据
		const formRef = ref()
		const loading = ref(false)

		// 表单数据
		const formData = ref({
			answer: '',
		})

		// 表单验证规则
		const formRules = {
			answer: [
				{
					required: true,
					message: '请输入密保答案',
					trigger: ['input', 'blur'],
				},
				{
					min: 1,
					max: 100,
					message: '密保答案长度应在1-100个字符之间',
					trigger: ['input', 'blur'],
				},
			],
		}

		// 计算属性：获取第一个密保问题
		const currentQuestion = computed(() => {
			return props.questions && props.questions.length > 0 ? props.questions[0] : null
		})

		// 计算属性：密保问题文本
		const questionText = computed(() => {
			return currentQuestion.value?.question_text || '暂无密保问题'
		})

		// 方法：处理取消操作
		const handleCancel = () => {
			// 优先使用传入的onCancel回调，否则使用默认的关闭弹窗方法
			if (props.onCancel) {
				props.onCancel()
			} else {
				closeQuestionsModal()
			}
		}

		// 方法：处理确认操作
		const handleConfirm = async () => {
			// 表单验证
			if (!formRef.value) return

			try {
				await formRef.value.validate()
			} catch (error) {
				return
			}

			// 检查是否有密保问题
			if (!currentQuestion.value || !currentQuestion.value.question_id) {
				message.error('没有有效的密保问题')
				return
			}

			try {
				loading.value = true

				// 调用验证接口
				const { fetch, data, message } = verifySecurityQuestions({
					operation_type: props.operationType || 'operation_protection',
					answers: [
						{
							question_id: currentQuestion.value.question_id,
							answer: formData.value.answer.trim(),
						},
					],
				})
				message.value = true
				await fetch()

				if (data.value?.status) {
					handleCancel()
					const response = data.value.data as VerifySecurityQuestionsResponse

					// 清空表单
					formData.value.answer = ''

					// 通过回调函数将security_token传递给上层方法
					props.onSuccess?.(response.security_token)
				}
			} finally {
				loading.value = false
			}
		}

		// 方法：处理密保重置页面跳转
		const handleResetRedirect = () => {
			closeQuestionsModal()
			message.info('准备跳转到密保重置页面')
			// 切换到 basic-security 标签页
			activeTab.value = 'basic-security'

			// 3秒后自动跳转
			setTimeout(() => {
				router.push('/domain-security')
			}, 3000)
		}

		// 组件挂载时的初始化
		onMounted(() => {
			// 检查是否有密保问题数据
			if (!props.questions || props.questions.length === 0) {
				message.warning('未提供密保问题数据')
			}
		})

		return {
			formRef,
			loading,
			formData,
			formRules,
			currentQuestion,
			questionText,
			handleCancel,
			handleConfirm,
			handleResetRedirect,
		}
	},
	render() {
		return (
			<div>
				{/* 表单区域 */}
				<NForm ref="formRef" model={this.formData} rules={this.formRules} labelPlacement="top">
					{/* 密保问题显示区 */}
					<NFormItem label="密保问题" required>
						<NInput v-model:value={this.questionText} readonly placeholder="密保问题" />
					</NFormItem>

					{/* 密保答案输入区 */}
					<NFormItem label="密保答案" path="answer" required>
						<NInput
							v-model:value={this.formData.answer}
							placeholder="请输入密保答案"
							type="password"
							showPasswordOn="click"
							disabled={this.loading}
							onKeyup={(e: KeyboardEvent) => {
								if (e.key === 'Enter') {
									this.handleConfirm()
								}
							}}
							clearable
						/>
					</NFormItem>
				</NForm>

				{/* 辅助功能区 */}
				<div>
					<NText depth={3}>忘记密保答案？请联系客服或前往</NText>
					<NButton type="primary" text size="small" onClick={this.handleResetRedirect} disabled={this.loading}>
						密保重置页面
					</NButton>
				</div>

				{/* 操作按钮区 */}
				<NSpace justify="end">
					<NButton onClick={this.handleCancel} disabled={this.loading}>
						取消
					</NButton>
					<NButton type="primary" onClick={this.handleConfirm} loading={this.loading}>
						确认
					</NButton>
				</NSpace>
			</div>
		)
	},
})
