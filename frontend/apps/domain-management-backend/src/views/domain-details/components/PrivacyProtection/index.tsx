/**
 * 域名隐私保护弹窗组件
 * 提供 .CN/中国专属域名隐私保护服务
 */

import { defineComponent, computed, ref, type PropType } from 'vue'
import { 
  NSteps, 
  NStep, 
  NAlert, 
  NSpace, 
  NButton, 
  NSelect, 
  NInput, 
  NInputNumber,
  NRadioGroup, 
  NRadioButton,
  NQrCode,
  NFlex,
  NGrid,
  NGridItem,
  NTag
} from 'naive-ui'
import { usePrivacyProtectionController } from './useController'
import { useRechargeState } from "@/views/recharge/useStore"
import type { DomainInfo, PrivacyInfo } from '@/types/domain'

export default defineComponent({
	name: 'PrivacyProtectionModal',
	props: {
		domain: {
			type: Object as PropType<DomainInfo>,
			required: true,
		},
		privacy: {
			type: Object as PropType<PrivacyInfo>,
			default: null,
		},
		refresh: {
			type: Function as PropType<() => void>,
			required: true,
		},
		onClose: {
			type: Function as PropType<() => void>,
			required: false,
		},
	},

	setup(props) {
		const recharge = useRechargeState()
		const {
			protectionForm,
			currentStep,
			orderInfo,
			priceLoading,
			priceError,
			paymentMethod,
			orderCreating,
			orderCreated,
			qrCodeUrl,
			handleNext,
			handleCancel,
			handleBalancePayment,
			switchPaymentMethod,
		} = usePrivacyProtectionController(props)

		// 自定义时长状态管理
		const customTime = ref<number | null>(null)
		const selectedTimeType = ref<string | number>(protectionForm.value.protectionTime)
		const isQueryingPrice = ref(false) // 防止重复查询的标志位
		
		// 生成下拉框选项（预设时长 + 自定义）
		const timeSelectOptions = [
			{ label: '1年', value: 1 },
			{ label: '2年', value: 2 },
			{ label: '3年', value: 3 },
			{ label: '5年', value: 5 },
			{ label: '10年', value: 10 },
			{ label: '自定义', value: 'custom' }
		]
		
		// 当前是否为自定义模式
		const isCustomMode = computed(() => selectedTimeType.value === 'custom')
		
		// 验证自定义时长
		const isValidCustomTime = computed(() => {
			return customTime.value !== null && 
				   customTime.value >= 1 && 
				   customTime.value <= 10 &&
				   Number.isInteger(customTime.value)
		})
		
		// 处理下拉框选择变化
		const onTimeSelectChange = (value: string | number) => {
			selectedTimeType.value = value
			
			if (typeof value === 'number') {
				// 选择预设时长
				customTime.value = null
				protectionForm.value.protectionTime = value
			} else if (value === 'custom') {
				// 选择自定义模式
				if (customTime.value && isValidCustomTime.value) {
					protectionForm.value.protectionTime = customTime.value
				}
			}
		}
		
		// 查询价格的核心逻辑
		const queryCustomPrice = async () => {
			if (customTime.value !== null && isValidCustomTime.value && !isQueryingPrice.value) {
				isQueryingPrice.value = true
				try {
					protectionForm.value.protectionTime = customTime.value
					// 这里可以添加价格查询逻辑，如果controller中有相关方法
				} finally {
					// 短暂延迟后重置标志位，防止快速重复调用
					setTimeout(() => {
						isQueryingPrice.value = false
					}, 100)
				}
			}
		}
		
		// 处理自定义时长输入
		const onCustomTimeChange = (value: number | null) => {
			customTime.value = value
			// 输入过程中不立即查询价格，避免频繁调用接口
		}
		
		// 处理自定义输入框失焦
		const onCustomTimeBlur = () => {
			// 只在失焦时查询一次价格
			void queryCustomPrice()
		}
		
		// 处理回车键确认
		const onCustomTimeKeyup = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				// 先查询价格
				void queryCustomPrice()
				// 然后让输入框失去焦点，但防重复调用机制会阻止重复查询
				;(e.target as HTMLInputElement)?.blur()
			}
		}

		const canPayByBalance = computed(
			() => Number(recharge.overview.value?.balance || 0) >= Number(orderInfo.value?.data?.total_price || 0),
		)

		return () => (
			<div class="privacy-protection-modal">
				{/* 步骤指示器 */}
				<NSteps current={currentStep.value} class="mb-6">
					<NStep title="确认保护信息" />
					<NStep title="选择支付方式" />
				</NSteps>

				{/* 步骤1：确认保护信息 */}
				{currentStep.value === 1 && (
					<div class="step-content">
						<NAlert type="info" class="mb-6">
							.CN/.中国专属域名隐私保护服务可以保护个人信息不被公开查询
						</NAlert>

						<div class="form-container space-y-4 mb-8">
							{/* 域名 */}
							<div class="form-item flex items-center">
								<label class="form-label w-24 text-gray-700">域名</label>
								<span class="form-value text-gray-900 font-medium">{protectionForm.value.domain}</span>
							</div>

							{/* 隐私保护时长 */}
							<div class="form-item flex items-center">
								<label class="form-label w-24 text-gray-700">隐私保护时长</label>
								<div class="form-control">
									<NSpace>
										{/* 时长选择下拉框 */}
										<NSelect
											value={selectedTimeType.value}
											onUpdateValue={onTimeSelectChange}
											options={timeSelectOptions}
											loading={priceLoading.value}
											style={{ width: '120px' }}
											placeholder="选择时长"
										/>
										
										{/* 自定义时长输入框 - 同层显示 */}
										{isCustomMode.value && (
											<div style={{ display: 'inline-flex', alignItems: 'center' }}>
												<NInputNumber
													value={customTime.value}
													onUpdateValue={onCustomTimeChange}
													onBlur={onCustomTimeBlur}
													onFocus={(e: FocusEvent) => (e.target as HTMLInputElement).select()}
													placeholder="1-10年"
													min={1}
													max={10}
													precision={0}
													style={{ width: '120px' }}
													status={customTime.value !== null && !isValidCustomTime.value ? 'error' : undefined}
													inputProps={{
														onKeyup: onCustomTimeKeyup
													}}
												/>
												<span style={{ marginLeft: '4px', fontSize: '14px', color: '#666' }}>年</span>
											</div>
										)}
									</NSpace>
									
									{/* 错误提示 */}
									{isCustomMode.value && customTime.value !== null && !isValidCustomTime.value && (
										<div style={{ color: '#d03050', fontSize: '12px', marginTop: '8px' }}>
											隐私保护时长必须为1-10年的整数
										</div>
									)}
								</div>
							</div>

							{/* 联系邮箱 */}
							<div class="form-item flex items-center">
								<label class="form-label w-24 text-gray-700">联系邮箱</label>
								<div class="form-control">
									<NInput
										v-model:value={protectionForm.value.contactEmail}
										placeholder="请输入联系邮箱（可选）"
										style={{ width: '320px' }}
									/>
								</div>
							</div>

							{/* 保护价格 */}
							<div class="form-item flex items-center">
								<label class="form-label w-24 text-gray-700">保护价格</label>
								<span class="form-value text-red-500 font-bold text-xl">
									{priceLoading.value
										? '--'
										: priceError.value
											? '--'
											: protectionForm.value.price > 0
												? `¥${protectionForm.value.price}`
												: '--'}
								</span>
							</div>
						</div>

						{/* 只在步骤一显示底部操作按钮 */}
						<div class="flex justify-end">
							<NSpace>
								<NButton onClick={handleCancel}>取消</NButton>
								<NButton
									type="primary"
									onClick={handleNext}
									disabled={priceLoading.value || orderCreating.value}
									loading={orderCreating.value}
								>
									{orderCreating.value ? '正在创建订单...' : '下一步'}
								</NButton>
							</NSpace>
						</div>
					</div>
				)}

				{/* 步骤2：选择支付方式 */}
				{currentStep.value === 2 && (
					<div class="step-content">
						<NGrid cols="1" xGap={12} yGap={20}>
							{/* 订单确认信息 */}
							<NGridItem>
								<div class="order-summary mb-6">
									<div class="order-info-list space-y-3">
										<div class="order-item flex justify-between items-center">
											<span class="order-label text-gray-700">域名：</span>
											<span class="order-value text-gray-900 font-medium">{protectionForm.value.domain}</span>
										</div>
										<div class="order-item flex justify-between items-center">
											<span class="order-label text-gray-700">保护时长：</span>
											<span class="order-value text-gray-900">{protectionForm.value.protectionTime}年</span>
										</div>
										<div class="order-item flex justify-between items-center">
											<span class="order-label text-gray-700">联系邮箱：</span>
											<span class="order-value text-gray-900">{protectionForm.value.contactEmail || '未填写'}</span>
										</div>
										<div class="order-item flex justify-between items-center">
											<span class="order-label text-gray-700">保护费用：</span>
											<div class="flex items-center">
													{/* 原价 */}
												<span class="text-gray-500 text-sm mr-2" style={{ textDecoration: 'line-through' }}>原价：¥{orderInfo.value?.data?.original_price}</span>
												<span class="order-value text-red-500 font-bold text-lg">
													¥
													{orderCreated.value && orderInfo.value?.data?.total_price
														? orderInfo.value.data.total_price
														: protectionForm.value.price}
												</span>
											</div>
										</div>
									</div>
								</div>
							</NGridItem>

							{/* 支付方式选择 */}
							<NGridItem class="flex items-center">
								<strong class="text-sm mr-4">选择支付方式</strong>
								<NRadioGroup value={paymentMethod.value} size="small" onUpdateValue={switchPaymentMethod}>
									<NRadioButton value="wechat">微信支付</NRadioButton>
									<NRadioButton value="alipay">支付宝</NRadioButton>
									<NRadioButton value="balance">余额支付</NRadioButton>
								</NRadioGroup>
							</NGridItem>

							{/* 支付内容展示 */}
							<NGridItem>
								{orderCreating.value ? (
									<NFlex vertical align="center" class="py-8">
										<div class="text-gray-600">正在创建订单...</div>
									</NFlex>
								) : !orderCreated.value ? (
									<NFlex vertical align="center" class="py-8">
										<div class="text-red-500">订单创建失败，请重试</div>
									</NFlex>
								) : paymentMethod.value !== 'balance' ? (
									<NFlex vertical align="center">
										<NQrCode value={qrCodeUrl.value || ''} size={180} />
										<div class="text-xs text-gray-600">
											请使用{paymentMethod.value === 'wechat' ? '微信' : '支付宝'}扫码支付
										</div>
									</NFlex>
								) : (
									<NFlex vertical align="center" class="py-6">
										<NTag type={canPayByBalance.value ? 'success' : 'warning'} bordered={false}>
											可用余额：¥{Number(recharge.overview.value?.balance || 0).toFixed(2)} / 需支付：¥
											{Number(orderInfo.value?.data?.total_price || protectionForm.value.price).toFixed(2)}
										</NTag>
										<NButton
											type="primary"
											size="large"
											disabled={!canPayByBalance.value}
											onClick={handleBalancePayment}
											class="mt-4"
										>
											立即支付
										</NButton>
									</NFlex>
								)}
							</NGridItem>
						</NGrid>

						{/* 步骤二没有底部操作按钮 */}
					</div>
				)}
			</div>
		)
	},
})