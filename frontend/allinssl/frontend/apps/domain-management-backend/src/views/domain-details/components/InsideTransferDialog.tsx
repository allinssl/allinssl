import { defineComponent, computed, ref, onMounted, type PropType } from 'vue'
import { NButton, NFlex, NGrid, NGridItem, NInput, NInputGroup, NSteps, NStep, NAlert, NIcon, NTag } from 'naive-ui'
import { useMessage } from '@baota/naive-ui/hooks'
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
import { applyInsideTransfer } from '@/api/transfer'
import type { InsideTransferRequest } from '@/types/transfer'
import { executeApiWithSecurityVerification } from '@/public/dialog'

export default defineComponent({
	name: 'InsideTransferDialog',
	props: {
		/** 域名ID */
		domainId: {
			type: Number,
			required: true,
		},
		/** 域名名称 */
		domainName: {
			type: String,
			required: true,
		},
		/** 初始步骤 */
		initialStep: {
			type: Number,
			default: 1,
		},
		/** 转移数据 */
		transferData: {
			type: Object,
			default: null,
		},
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
	setup(props) {
		const message = useMessage()

		// 步骤状态管理
		const currentStep = ref(props.initialStep || 1)
		const isLoading = ref(false)

		// 表单数据
		const formData = ref({
			targetAccount: '',
			transferCode: '',
		})

		// 表单验证状态
		const formErrors = ref({
			targetAccountError: '',
		})

		// 验证方法
		const validateTargetAccount = (account: string): string => {
			if (!account.trim()) return '目标账号不能为空'
			return ''
		}

		// 生成随机密码
		const generateRandomPassword = () => {
			// 确保密码包含大小写字母和数字的组合
			const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ'
			const lowercase = 'abcdefghijkmnpqrstuvwxyz'
			const numbers = '23456789'
			const allChars = uppercase + lowercase + numbers

			let password = ''

			// 确保至少包含一个大写字母、一个小写字母和一个数字
			password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
			password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
			password += numbers.charAt(Math.floor(Math.random() * numbers.length))

			// 生成剩余的3位字符
			for (let i = 3; i < 6; i++) {
				password += allChars.charAt(Math.floor(Math.random() * allChars.length))
			}

			// 打乱密码字符顺序
			password = password
				.split('')
				.sort(() => Math.random() - 0.5)
				.join('')

			formData.value.transferCode = password
		}

		// 组件挂载时自动生成转移码或填充数据
		onMounted(() => {
			if (props.transferData && props.initialStep === 2) {
				// 查看进度模式：填充已有数据
				formData.value.targetAccount = props.transferData.to_account || ''
				formData.value.transferCode = props.transferData.transfer_code || ''
			} else {
				// 新建转移模式：生成随机密码
				generateRandomPassword()
			}
		})

		// 表单验证状态计算属性
		const isFormValid = computed(() => {
			const hasTargetAccount = formData.value.targetAccount.trim().length > 0
			const hasTransferCode = formData.value.transferCode.trim().length > 0

			if (!hasTargetAccount || !hasTransferCode) return false

			// 检查是否有验证错误
			const targetAccountError = validateTargetAccount(formData.value.targetAccount)

			return !targetAccountError
		})

		// 处理下一步
		const handleNext = () => {
			if (currentStep.value === 1) {
				// 验证表单
				formErrors.value.targetAccountError = validateTargetAccount(formData.value.targetAccount)

				if (isFormValid.value) {
					handleTransfer()
				}
			}
		}

		// 处理转移操作
		const handleTransfer = async () => {
			try {
				const transferData: InsideTransferRequest = {
					to_account: formData.value.targetAccount.trim(),
					domain_id: props.domainId,
					transfer_code: formData.value.transferCode.trim(),
				}

				const info = await executeApiWithSecurityVerification(applyInsideTransfer as any, transferData, {
					showMessage: true,
					setLoading: (load: boolean) => {
						isLoading.value = load
					},
				})

				if (info.status) {
					currentStep.value = 2
					// 刷新父组件数据
					await props.refresh()
				}
			} catch (error: any) {
				console.error('Transfer error:', error)
				message.error('转移申请失败')
			}
		}

		// 渲染步骤一：填写目标账号信息
		const renderStep1 = () => (
			<NGrid cols="1" xGap={12} yGap={16}>
				{/* 目标账号输入 */}
				<NGridItem class="flex items-center gap-4">
					<div class="text-gray-500 text-sm whitespace-nowrap w-20 text-right">目标账号</div>
					<div class="flex-1">
						<NInput
							value={formData.value.targetAccount}
							onUpdateValue={(v) => {
								formData.value.targetAccount = v
								formErrors.value.targetAccountError = ''
							}}
							onBlur={() => {
								formErrors.value.targetAccountError = validateTargetAccount(formData.value.targetAccount)
							}}
							placeholder="请输入目标账号"
							status={formErrors.value.targetAccountError ? 'error' : undefined}
						/>
						{formErrors.value.targetAccountError && (
							<div class="text-red-500 text-xs mt-1 px-1">{formErrors.value.targetAccountError}</div>
						)}
					</div>
				</NGridItem>

				{/* 转移码输入 */}
				<NGridItem class="flex items-center gap-4 mb-6">
					<div class="text-gray-500 text-sm whitespace-nowrap w-20 text-right">转移码</div>
					<div class="flex-1">
						<NInputGroup>
							<NInput value={formData.value.transferCode} readonly placeholder="系统已自动生成转移码" />
							<NButton type="primary" onClick={generateRandomPassword}>
								重新生成
							</NButton>
						</NInputGroup>
					</div>
				</NGridItem>

				{/* 按钮区域 */}
				<NGridItem>
					<NFlex justify="end" class="gap-3">
						<NButton onClick={() => props.close()}>取消</NButton>
						<NButton type="primary" disabled={!isFormValid.value} loading={isLoading.value} onClick={handleNext}>
							下一步
						</NButton>
					</NFlex>
				</NGridItem>
			</NGrid>
		)

		// 渲染步骤二：等待转移
		const renderStep2 = () => (
			<NGrid cols="1" xGap={12} yGap={16} class="mb-6">
				{/* 转移信息显示 */}
				<NGridItem>
					<NFlex vertical class="gap-4">
						{/* 域名 */}
						<div class="flex items-center gap-4">
							<div class="text-gray-500 text-sm whitespace-nowrap w-20 text-right">域名</div>
							<div class="flex-1">
								<NInput value={props.domainName} readonly />
							</div>
						</div>

						{/* 转移码 */}
						<div class="flex items-center gap-4">
							<div class="text-gray-500 text-sm whitespace-nowrap w-20 text-right">转移码</div>
							<div class="flex-1">
								<NInput value={formData.value.transferCode} readonly />
							</div>
						</div>

						{/* 目标账号 */}
						<div class="flex items-center gap-4">
							<div class="text-gray-500 text-sm whitespace-nowrap w-20 text-right">目标账号</div>
							<div class="flex-1">
								<NInput value={formData.value.targetAccount} readonly />
							</div>
						</div>

						{/* 转移状态 */}
						<div class="flex items-center gap-4 justify-">
							<div class="text-gray-500 text-sm whitespace-nowrap w-20 text-right">转移状态</div>
							<div class="flex-1">
								<NTag type="warning" bordered={false}>
									{props.transferData?.status_text || '等待确认'}
								</NTag>
							</div>
						</div>
					</NFlex>
				</NGridItem>
			</NGrid>
		)

		return () => (
			<div class="p-2">
				<NSteps current={currentStep.value} status="process" class="mb-6">
					<NStep title="填写目标账号信息">
						<div>输入转移目标</div>
					</NStep>
					<NStep title="等待转移">
						<div>转移进行中</div>
					</NStep>
				</NSteps>
				{currentStep.value === 1 ? renderStep1() : renderStep2()}
			</div>
		)
	},
})
