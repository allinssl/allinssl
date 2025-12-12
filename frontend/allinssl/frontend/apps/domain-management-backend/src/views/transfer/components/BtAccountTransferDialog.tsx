import { defineComponent, computed, ref, type PropType } from 'vue'
import {
	NButton,
	NFlex,
	NGrid,
	NGridItem,
	NInput,
	NInputGroup,
	NSteps,
	NStep,
	NDynamicInput,
	NAlert,
	NIcon,
} from 'naive-ui'
import { useMessage } from '@baota/naive-ui/hooks'
import { CheckmarkCircleOutline } from '@vicons/ionicons5'
import { executeBtAccountTransfer } from '@/api/transfer'
import type { BtAccountTransferRequest, BtAccountTransferDomainItem } from '@/types/transfer'
import { executeApiWithSecurityVerification } from '@/public/dialog'

export default defineComponent({
	name: 'BtAccountTransferDialog',
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
	setup(props) {
		const message = useMessage()

		// 步骤状态管理
		const currentStep = ref(1)
		const isLoading = ref(false)

		// 表单数据
		const formData = ref({
			sourceAccount: '',
			rows: [{ domain: '', transfer_code: '' }] as Array<{ domain: string; transfer_code: string }>,
		})

		// 表单验证状态
		const rowValidation = ref([{ domainError: '', transferCodeError: '' }])

		// 验证方法 - 完全参照JoinIn组件
		const validateDomain = (domain: string): string => {
			if (!domain.trim()) return '域名不能为空'
			const domainRegex =
				/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/
			return domainRegex.test(domain.trim()) ? '' : '域名格式不正确，请输入有效的域名格式，如：example.com'
		}

		const validateTransferCode = (code: string): string => {
			if (!code.trim()) return '转移码不能为空'
			if (code.trim().length < 6) return '转移码长度不能少于6位'
			return ''
		}

		// 验证单个输入行 - 完全参照JoinIn组件
		const validateRow = (index: number, field: 'domain' | 'transfer_code', value: string) => {
			// 确保验证数组有足够的长度
			while (rowValidation.value.length <= index) {
				rowValidation.value.push({ domainError: '', transferCodeError: '' })
			}

			const validation = rowValidation.value[index]
			if (!validation) return

			if (field === 'domain') {
				validation.domainError = validateDomain(value)
			} else {
				validation.transferCodeError = validateTransferCode(value)
			}
		}

		// 设置行字段值
		const setRowField = (index: number, field: 'domain' | 'transfer_code', value: string) => {
			// 确保数组有足够的长度
			while (formData.value.rows.length <= index) {
				formData.value.rows.push({ domain: '', transfer_code: '' })
			}

			// 安全访问数组元素
			const row = formData.value.rows[index]
			if (row) {
				row[field] = value
				validateRow(index, field, value)
			}
		}

		// 表单验证状态计算属性 - 完全参照JoinIn组件
		const isFormValid = computed(() => {
			const hasSourceAccount = formData.value.sourceAccount.trim().length > 0
			if (!hasSourceAccount) return false

			if (formData.value.rows.length === 0) return false
			// 检查是否有非空的域名和转移码，且没有验证错误
			const hasValidRows = formData.value.rows.some((row) => row.domain.trim() && row.transfer_code.trim())
			if (!hasValidRows) return false

			const hasErrors = rowValidation.value.some((validation, index) => {
				if (index >= formData.value.rows.length) return false
				const row = formData.value.rows[index]
				if (!row) return false
				return (
					(row.domain.trim() && validation.domainError) || (row.transfer_code.trim() && validation.transferCodeError)
				)
			})
			return !hasErrors
		})

		// 处理下一步
		const handleNext = () => {
			if (currentStep.value === 1) {
				// 验证表单
				const rows = formData.value.rows.map((r, index) => {
					validateRow(index, 'domain', r.domain)
					validateRow(index, 'transfer_code', r.transfer_code)
					return r
				})

				if (isFormValid.value) {
					currentStep.value = 2
				}
			}
		}

		// 处理转入操作
		const handleTransfer = async () => {
			if (currentStep.value === 2) {
				try {
					const validRows = formData.value.rows.filter((r) => r.domain.trim() && r.transfer_code.trim())
					const transferData: BtAccountTransferRequest = {
						from_account: formData.value.sourceAccount,
						domain_list: validRows.map((r) => ({
							domain: r.domain.trim(),
							transfer_code: r.transfer_code.trim(),
						})),
					}

					const info = await executeApiWithSecurityVerification(executeBtAccountTransfer as any, transferData, {
						setLoading: (loading: boolean) => {
							isLoading.value = loading
						},
					})

					if (info?.status) {
						currentStep.value = 3
						message.success('转入操作已提交')
					} else {
						message.error(info?.msg || '转入失败')
					}
				} catch (error: any) {
					console.error('Transfer error:', error)
					message.error('转入操作失败')
				}
			}
		}

		// 渲染步骤一：输入转移信息
		const renderStep1 = () => (
			<NGrid cols="1" xGap={12} yGap={16}>
				{/* 源账号输入 */}
				<NGridItem class="flex items-start gap-4">
					<div class="text-gray-500 text-sm whitespace-nowrap mt-1 w-20 text-right">源账号</div>
					<div class="flex-1">
						<NInput
							value={formData.value.sourceAccount}
							onUpdateValue={(v) => (formData.value.sourceAccount = v)}
							placeholder="请输入源账号"
						/>
					</div>
				</NGridItem>

				{/* 域名和转移码输入区域 - 完全参照TransferDialog组件 */}
				<NGridItem class="flex items-start gap-4">
					<div class="text-gray-500 text-sm whitespace-nowrap mt-1">域名和转移码</div>
					<NDynamicInput
						value={formData.value.rows as any}
						onUpdateValue={(v) => {
							formData.value.rows = v as Array<{ domain: string; transfer_code: string }>
							// 确保验证数组长度一致
							const newRows = v as Array<{ domain: string; transfer_code: string }>
							while (rowValidation.value.length < newRows.length) {
								rowValidation.value.push({ domainError: '', transferCodeError: '' })
							}
						}}
						onCreate={() => ({ domain: '', transfer_code: '' })}
						class="max-h-[300px] overflow-y-auto"
					>
						{{
							default: ({ value, index }: { value: { domain: string; transfer_code: string }; index: number }) => (
								<NInputGroup>
									<div class="flex-1">
										<NInput
											placeholder="请输入域名，如：example.com"
											value={value.domain}
											status={rowValidation.value[index]?.domainError ? 'error' : undefined}
											onUpdateValue={(v) => {
												setRowField(index, 'domain', v)
											}}
											onBlur={() => validateRow(index, 'domain', value.domain)}
										/>
										{rowValidation.value[index]?.domainError && (
											<div class="text-red-500 text-xs mt-1 px-1">{rowValidation.value[index].domainError}</div>
										)}
									</div>

									<div class="w-40">
										<NInput
											placeholder="请输入转移码"
											value={value.transfer_code}
											status={rowValidation.value[index]?.transferCodeError ? 'error' : undefined}
											onUpdateValue={(v) => {
												setRowField(index, 'transfer_code', v)
											}}
											onBlur={() => validateRow(index, 'transfer_code', value.transfer_code)}
										/>
										{rowValidation.value[index]?.transferCodeError && (
											<div class="text-red-500 text-xs mt-1 px-1">{rowValidation.value[index].transferCodeError}</div>
										)}
									</div>
								</NInputGroup>
							),
						}}
					</NDynamicInput>
				</NGridItem>

				{/* 按钮区域 */}
				<NGridItem>
					<NFlex justify="end" class="gap-3">
						<NButton onClick={() => props.close()}>取消</NButton>
						<NButton type="primary" disabled={!isFormValid.value} onClick={handleNext}>
							下一步
						</NButton>
					</NFlex>
				</NGridItem>
			</NGrid>
		)

		// 渲染步骤二：确认转入
		const renderStep2 = () => (
			<NGrid cols="1" xGap={12} yGap={16}>
				{/* 确认信息提示 */}
				<NGridItem>
					<NFlex vertical align="center" class="py-4">
						<NAlert type="info" title="请确认以下转入信息是否正确" class="w-full mb-4" />

						<div class="w-full">
							<div class="mb-4">
								<div class="text-sm text-gray-600 mb-2">源账号：</div>
								<div class="text-base font-medium">{formData.value.sourceAccount}</div>
							</div>

							<div>
								<div class="text-sm text-gray-600 mb-2">域名和转移码列表：</div>
								<div class="border rounded max-h-[200px] overflow-y-auto">
									<div class="grid grid-cols-2 bg-gray-50 text-gray-600 text-sm p-2">
										<div>域名</div>
										<div>转移码</div>
									</div>
									{formData.value.rows
										.filter((r) => r.domain.trim() && r.transfer_code.trim())
										.map((row, index) => (
											<div class="grid grid-cols-2 p-2 border-t" key={index}>
												<div>{row.domain}</div>
												<div>{row.transfer_code}</div>
											</div>
										))}
								</div>
							</div>
						</div>
					</NFlex>
				</NGridItem>

				{/* 按钮区域 */}
				<NGridItem>
					<NFlex justify="end" class="gap-3">
						<NButton onClick={() => (currentStep.value = 1)}>返回上一步</NButton>
						<NButton type="primary" loading={isLoading.value} onClick={handleTransfer}>
							确认转入
						</NButton>
					</NFlex>
				</NGridItem>
			</NGrid>
		)

		// 渲染步骤三：转入结果
		const renderStep3 = () => (
			<NGrid cols="1" xGap={12} yGap={20}>
				<NGridItem>
					<NFlex vertical align="center" class="py-8">
						{/* 成功图标 */}
						<NIcon size="64" color="#52c41a" class="mb-4">
							<CheckmarkCircleOutline />
						</NIcon>

						{/* 成功提示文字 */}
						<div class="text-lg font-medium text-gray-800 mb-2">转入成功</div>
						<div class="text-sm text-gray-600">域名转入操作已成功提交</div>
					</NFlex>
				</NGridItem>

				{/* 按钮区域 */}
				<NGridItem>
					<NFlex justify="center" class="gap-3">
						<NButton
							type="primary"
							onClick={() => {
								props.close()
								props.refresh()
							}}
						>
							完成
						</NButton>
					</NFlex>
				</NGridItem>
			</NGrid>
		)

		return () => (
			<div class="p-2">
				<NSteps current={currentStep.value} status="process" class="mb-6">
					<NStep title="输入转移信息">
						<div>填写域名和转移码</div>
					</NStep>
					<NStep title="确认转入">
						<div>验证转移信息</div>
					</NStep>
					<NStep title="转入结果">
						<div>验证转移信息</div>
					</NStep>
				</NSteps>
				{currentStep.value === 1 ? renderStep1() : currentStep.value === 2 ? renderStep2() : renderStep3()}
			</div>
		)
	},
})
