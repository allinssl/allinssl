/**
 * 密保问题设置对话框组件
 * 包含三个步骤：手机验证、设置密保、完成设置
 */
import { defineComponent, ref, computed, onMounted } from 'vue'
import {
	NForm,
	NFormItem,
	NInput,
	NSelect,
	NButton,
	NSpace,
	NSteps,
	NStep,
	NIcon,
	NText,
	NSpin,
	NResult,
	NInputGroup,
	useMessage,
} from 'naive-ui'
import { useDomainSecurityState } from '../useStore'
import { useController } from '../useController'
import type { SecurityQuestionAnswer } from '../types'

interface SecurityQuestionDialogProps {
	/** 刷新回调 */
	refresh?: () => void
	/** 关闭回调 */
	close?: () => void
}

export default defineComponent({
	name: 'SecurityQuestionDialog',
	props: {
		refresh: {
			type: Function,
			default: () => {},
		},
		close: {
			type: Function,
			default: () => {},
		},
	},
	setup(props: SecurityQuestionDialogProps) {
		const message = useMessage()
		const {
			securityQuestionsList,
			securityStatus,
			loading,
			sendPhoneVerificationCode,
			verifyPhoneNumber,
			fetchSecurityQuestionsList,
			setupUserSecurityQuestions,
		} = useDomainSecurityState()

		// 当前步骤
		const currentStep = ref(1)

		// 步骤一：手机验证表单数据
		const phoneFormData = ref({
			phone: '',
			code: '',
		})

		// 当手机号已验证时，自动填充手机号
		if (securityStatus.value.phone_verified && securityStatus.value.phone) {
			phoneFormData.value.phone = securityStatus.value.phone
		}

		// 步骤二：密保问题表单数据
		const securityFormData = ref({
			question: '',
			answer: '',
			confirmAnswer: '',
		})

		// 发送验证码按钮状态
		const sendCodeLoading = ref(false)
		const sendCodeDisabled = ref(false)
		const sendCodeText = ref('发送验证码')
		const countdown = ref(0)

		// 验证手机按钮状态
		const verifyPhoneLoading = ref(false)

		// 设置密保按钮状态
		const setupLoading = ref(false)

		// 密保问题列表加载状态
		const questionsLoading = ref(false)

		// 手机号表单验证规则
		const phoneRules = [
			{
				required: true,
				message: '请输入手机号码',
				trigger: ['input', 'blur'],
			},
			{
				pattern: /^1[3-9]\d{9}$/,
				message: '请输入正确的手机号码格式',
				trigger: ['input', 'blur'],
			},
		]

		// 验证码表单验证规则
		const codeRules = [
			{
				required: true,
				message: '请输入验证码',
				trigger: ['input', 'blur'],
			},
			{
				min: 4,
				message: '验证码至少4位',
				trigger: ['input', 'blur'],
			},
		]

		// 表单引用
		const phoneFormRef = ref()

		// 计算属性：密保问题选项
		const questionOptions = computed(() => {
			if (!securityQuestionsList.value || typeof securityQuestionsList.value !== 'object') {
				return []
			}
			return Object.entries(securityQuestionsList.value).map(([id, text]) => ({
				label: text,
				value: id,
			}))
		})

		// 发送验证码
		const handleSendCode = async () => {
			// 手动验证手机号格式
			const phone = phoneFormData.value.phone
			if (!phone) {
				message.error('请输入手机号码')
				return
			}

			if (!/^1[3-9]\d{9}$/.test(phone)) {
				message.error('请输入正确的手机号码格式')
				return
			}

			try {
				sendCodeLoading.value = true
				await sendPhoneVerificationCode({ phone: phoneFormData.value.phone })
				message.success('验证码发送成功')

				// 开始倒计时
				sendCodeDisabled.value = true
				countdown.value = 60
				const timer = setInterval(() => {
					countdown.value--
					sendCodeText.value = `${countdown.value}s后重发`
					if (countdown.value <= 0) {
						clearInterval(timer)
						sendCodeDisabled.value = false
						sendCodeText.value = '发送验证码'
					}
				}, 1000)
			} catch (error) {
				console.error('发送验证码失败:', error)
				message.error('发送验证码失败，请稍后重试')
			} finally {
				sendCodeLoading.value = false
			}
		}

		// 验证手机号
		const handleVerifyPhone = async () => {
			// 使用表单验证
			try {
				await phoneFormRef.value?.validate()
			} catch (error) {
				return
			}

			try {
				verifyPhoneLoading.value = true
				const verifyResult = await verifyPhoneNumber({
					phone: phoneFormData.value.phone,
					code: phoneFormData.value.code,
				})

				// 检查验证结果，只有返回true时才继续执行后续步骤
				if (verifyResult) {
					// 验证成功，进入下一步
					currentStep.value = 2
					// 加载密保问题列表
					await loadSecurityQuestions()
				}
			} catch (error) {
				console.error('手机验证失败:', error)
				message.error('手机验证失败，请检查验证码是否正确')
			} finally {
				verifyPhoneLoading.value = false
			}
		}

		// 加载密保问题列表
		const loadSecurityQuestions = async () => {
			try {
				questionsLoading.value = true
				await fetchSecurityQuestionsList()
			} catch (error) {
				console.error('加载密保问题列表失败:', error)
			} finally {
				questionsLoading.value = false
			}
		}

		// 设置密保问题
		const handleSetupSecurity = async () => {
			// 验证表单数据
			const { question, answer, confirmAnswer } = securityFormData.value

			if (!question || !answer || !confirmAnswer) {
				message.error('请完整填写密保问题')
				return
			}

			if (answer !== confirmAnswer) {
				message.error('密保问题的答案不一致')
				return
			}

			const questions: SecurityQuestionAnswer[] = [
				{
					question_id: Number(question),
					answer,
					confirm_answer: confirmAnswer,
				},
			]

			try {
				setupLoading.value = true
				await setupUserSecurityQuestions({ questions })

				// 设置成功，进入完成步骤
				currentStep.value = 3

				// 刷新父组件数据
				props.refresh?.()
			} catch (error) {
				console.error('设置密保问题失败:', error)
			} finally {
				setupLoading.value = false
			}
		}

		// 取消操作
		const handleCancel = () => {
			props.close?.()
		}

		// 完成操作
		const handleComplete = () => {
			props.close?.()
		}

		return () => (
			<div class="security-question-dialog">
				{/* 步骤指示器 */}
				<NSteps current={currentStep.value} class="mb-6">
					<NStep title="手机验证" />
					<NStep title="设置密保" />
					<NStep title="完成设置" />
				</NSteps>

				{/* 步骤一：手机验证 */}
				{currentStep.value === 1 && (
					<>
						<NForm ref={phoneFormRef} model={phoneFormData.value} labelPlacement="left" labelWidth="80">
							<NFormItem label="手机号码" path="phone" rule={phoneRules}>
								<NInput
									v-model:value={phoneFormData.value.phone}
									placeholder="请输入11位手机号码"
									maxlength={11}
									disabled={securityStatus.value.phone_verified}
								/>
							</NFormItem>
							<NFormItem label="验证码" path="code" rule={codeRules}>
								<NInputGroup style="width: 100%">
									<NInput v-model:value={phoneFormData.value.code} placeholder="请输入验证码" style="width: 100%" />
									<NButton
										type="primary"
										loading={sendCodeLoading.value}
										disabled={sendCodeDisabled.value}
										onClick={handleSendCode}
									>
										{sendCodeText.value}
									</NButton>
								</NInputGroup>
							</NFormItem>
						</NForm>

						<NSpace justify="end" class="mt-6">
							<NButton onClick={handleCancel}>取消</NButton>
							<NButton type="primary" loading={verifyPhoneLoading.value} onClick={handleVerifyPhone}>
								验证手机
							</NButton>
						</NSpace>
					</>
				)}

				{/* 步骤二：设置密保 */}
				{currentStep.value === 2 && (
					<div class="min-h-[300px]">
						<h3 class="text-lg font-medium mb-4">设置密保</h3>
						<NSpin show={questionsLoading.value}>
							<NForm model={securityFormData.value} labelPlacement="top">
								{/* 密保问题 */}
								<NFormItem label="密保问题" required>
									<NSelect
										v-model:value={securityFormData.value.question}
										placeholder="请选择密保问题"
										options={questionOptions.value}
									/>
								</NFormItem>
								<NFormItem label="答案" required>
									<NInput v-model:value={securityFormData.value.answer} placeholder="请输入答案" type="text" />
								</NFormItem>
								<NFormItem label="确认答案" required>
									<NInput
										v-model:value={securityFormData.value.confirmAnswer}
										placeholder="请再次输入答案"
										type="text"
									/>
								</NFormItem>
							</NForm>
						</NSpin>

						<NSpace justify="end" class="mt-6">
							<NButton onClick={handleCancel}>取消</NButton>
							<NButton type="primary" loading={setupLoading.value} onClick={handleSetupSecurity}>
								设置密保
							</NButton>
						</NSpace>
					</div>
				)}

				{/* 步骤三：完成设置 */}
				{currentStep.value === 3 && (
					<div class="min-h-[300px]">
						<div class="flex flex-col items-center justify-center py-12">
							<NResult status="success" title="密保问题设置成功">
								{{
									default: () => <NText depth="3">您的密保问题已成功设置，现在可以使用安全功能了</NText>,
								}}
							</NResult>

							<NSpace class="mt-6">
								<NButton type="primary" onClick={handleComplete}>
									完成
								</NButton>
							</NSpace>
						</div>
					</div>
				)}
			</div>
		)
	},
})
