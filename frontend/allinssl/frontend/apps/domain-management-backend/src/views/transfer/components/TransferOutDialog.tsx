import { defineComponent, computed, onMounted, ref, type PropType } from 'vue'
import { NButton, NFlex, NGrid, NGridItem, NInput, NSteps, NStep, NSelect, NCheckbox, NIcon } from 'naive-ui'
import { useMessage } from '@baota/naive-ui/hooks'
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
import { sendDomainTransferCode } from '@/api/transfer'
import { fetchDomainList } from '@/api/domain'
import { executeApiWithSecurityVerification } from '@/public/dialog'

export default defineComponent({
	name: 'TransferOutDialog',
	props: {
		/** 刷新数据函数 */
		refresh: {
			type: Function as PropType<() => Promise<void>>,
			default: () => Promise.resolve(),
		},
		/** 关闭对话框函数 */
		close: {
			type: Function as PropType<() => void>,
			default: () => {},
		},
	},
	setup(props, { expose }) {
		const message = useMessage()

		// 步骤状态管理
		const currentStep = ref(1)
		const isLoading = ref(false)

		// 域名列表状态
		const domainList = ref<Array<{ label: string; value: string }>>([])
		const loadingDomains = ref(true)

		// 表单数据
		const formData = ref({
			selectedDomain: '' as string,
			email: '',
			agreeTerms: false,
		})

		// 邮箱验证状态
		const emailValidation = ref({
			isValid: false,
			errorMessage: '',
		})

		// 域名选项计算属性
		const domainOptions = computed(() => domainList.value)

		// 表单验证状态计算属性
		const isFormValid = computed(() => {
			const hasSelectedDomain = formData.value.selectedDomain
			const hasEmail = formData.value.email.trim().length > 0
			const hasAgreedTerms = formData.value.agreeTerms
			const isEmailValid = emailValidation.value.isValid

			return hasSelectedDomain && hasEmail && hasAgreedTerms && isEmailValid
		})

		// 邮箱格式验证函数
		const validateEmail = (email: string): { isValid: boolean; errorMessage: string } => {
			// 清空时验证状态为无效，但不显示错误信息
			if (!email.trim()) {
				return { isValid: false, errorMessage: '' }
			}
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(email)) {
				return { isValid: false, errorMessage: '邮箱格式不正确' }
			}

			return { isValid: true, errorMessage: '' }
		}

		// 处理邮箱失去焦点事件
		const handleEmailBlur = () => {
			const validation = validateEmail(formData.value.email)
			emailValidation.value = validation
		}

		// 加载域名列表的方法
		const loadDomainList = async () => {
			try {
				loadingDomains.value = true
				const { fetch, data } = fetchDomainList({
					p: 1,
					rows: 1000,
				})
				await fetch()

				// 确保数据结构正确，data.value?.data 是域名数组
				const dList = data.value?.data.data
				if (Array.isArray(dList)) {
					const mappedDomainList = dList.map((domain: any) => ({
						label: `${domain.full_domain} (${domain.transfer_status.status === 1 ? '可以转移' : domain.transfer_status.msg})`,
						value: domain.id,
						disabled: domain.transfer_status.status === 0,
					}))
					domainList.value = mappedDomainList
				} else {
					console.warn('域名列表数据格式不正确:', dList)
					domainList.value = []
				}
			} catch (error) {
				console.error('加载域名列表失败:', error)
				message.error('加载域名列表失败')
				domainList.value = []
			} finally {
				loadingDomains.value = false
			}
		}

		// 组件挂载时自动加载域名列表
		onMounted(async () => {
			await loadDomainList()
		})

		// 下一步处理
		const handleNext = async () => {
			if (currentStep.value === 1) {
				const info = await executeApiWithSecurityVerification(
					sendDomainTransferCode as any,
					{
						domain_id: formData.value.selectedDomain.toString(),
						email: formData.value.email,
					},
					{
						showMessage: true,
						setLoading: (load: boolean) => {
							isLoading.value = load
						},
					},
				)
				if (!info.status) {
					return
				}

				currentStep.value = 2
			}
		}

		// 渲染步骤一：核对信息
		const renderStep1 = () => (
			<NGrid cols="1" xGap={12} yGap={16}>
				{/* 转出域名选择 */}
				<NGridItem class="flex items-center gap-4">
					<div class="text-gray-500 text-sm whitespace-nowrap mt-1 w-25 text-right">转出域名</div>
					<div class="flex-1">
						<NSelect
							value={formData.value.selectedDomain}
							onUpdateValue={(v) => (formData.value.selectedDomain = v || '')}
							options={domainOptions.value}
							placeholder="请选择要转出的域名"
							loading={loadingDomains.value}
							filterable
							clearable
						/>
					</div>
				</NGridItem>

				{/* 接收转移码邮箱 */}
				<NGridItem class="flex items-center gap-4">
					<div class="text-gray-500 text-sm whitespace-nowrap mt-1">接收转移码邮箱</div>
					<div class="flex-1">
						<NInput
							value={formData.value.email}
							onUpdateValue={(v) => {
								formData.value.email = v
								// 实时验证邮箱格式
								emailValidation.value = validateEmail(v)
							}}
							onBlur={handleEmailBlur}
							placeholder="请输入邮箱地址"
							type="text"
							status={!emailValidation.value.isValid && emailValidation.value.errorMessage ? 'error' : undefined}
						/>
						{/* 显示验证错误信息 */}
						{!emailValidation.value.isValid && emailValidation.value.errorMessage && (
							<div class="text-red-500 text-xs mt-1">{emailValidation.value.errorMessage}</div>
						)}
					</div>
				</NGridItem>

				{/* 协议确认 */}
				<NGridItem>
					<NCheckbox checked={formData.value.agreeTerms} onUpdateChecked={(v) => (formData.value.agreeTerms = !!v)}>
						我已阅读并同意
						<a
							class="text-[#20a53a] hover:text-[#20a53a]-800 text-sm underline cursor-pointer ml-1"
							href="https://www.bt.cn/new/agreement_domain_register.html"
							rel="noopener noreferrer"
							target="_blank"
						>
							《域名转出协议》
						</a>
					</NCheckbox>
				</NGridItem>

				{/* 按钮区域 */}
				<NGridItem>
					<NFlex justify="end" class="gap-3">
						<NButton onClick={() => props.close()}>取消</NButton>
						<NButton type="primary" loading={isLoading.value} disabled={!isFormValid.value} onClick={handleNext}>
							下一步
						</NButton>
					</NFlex>
				</NGridItem>
			</NGrid>
		)

		// 渲染步骤二：获取转移码成功页面
		const renderStep2 = () => (
			<NGrid cols="1" xGap={12} yGap={20}>
				<NGridItem>
					<NFlex vertical align="center" class="py-8">
						{/* 成功图标 */}
						<NIcon size="64" color="#52c41a" class="mb-4">
							<CheckmarkCircleOutline />
						</NIcon>

						{/* 域名+成功提示文字 */}
						<div class="text-lg font-medium text-gray-800 mb-2">
							{domainOptions.value.find((d) => d.value === formData.value.selectedDomain)?.label.split(' ')[0]}{' '}
							域名转移码已发送成功
						</div>

						{/* 邮箱提示信息 */}
						<div class="text-sm text-gray-600">转移码已发送至{formData.value.email}</div>
					</NFlex>
				</NGridItem>
			</NGrid>
		)

		return () => (
			<div class="p-2">
				<NSteps current={currentStep.value} status="process" class="mb-6">
					<NStep title="核对信息">
						<div>确认域名和邮箱</div>
					</NStep>
					<NStep title="获取转移码">
						<div>转移码已发送</div>
					</NStep>
				</NSteps>
				{currentStep.value === 1 ? renderStep1() : renderStep2()}
			</div>
		)
	},
})
