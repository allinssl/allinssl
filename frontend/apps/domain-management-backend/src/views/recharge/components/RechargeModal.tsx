import { defineComponent, ref, watch, onMounted, computed } from 'vue'
import { NForm, NFormItem, NSelect, NSpace, NAlert, NInputNumber, NQrCode, NRadioGroup, NRadioButton } from 'naive-ui'
import { useRechargeState } from '../useStore'
import { useRechargeController } from '../useController'

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 400) {
	let t: any
	return (...args: Parameters<T>) => {
		clearTimeout(t)
		t = setTimeout(() => fn(...args), wait)
	}
}

export default defineComponent({
	name: 'RechargeDialogContent',
	setup() {
		const { createPayload, setCreatePayload, qrWxUrl, qrAliUrl } = useRechargeState()
		const { createRechargeOrder } = useRechargeController()

		// 预设金额配置
		const presets = [2000, 5000, 10000]
		const updating = ref(false)
		const customAmount = ref<number | null>(null)
		const selectedAmountType = ref<string | number>(2000) // 当前选中的下拉框值

		// 生成下拉框选项
		const amountOptions = [
			...presets.map((amount) => ({ label: `${amount}元`, value: amount })),
			{ label: '自定义', value: 'custom' },
		]

		// 当前是否为自定义模式
		const isCustomMode = computed(() => selectedAmountType.value === 'custom')

		// 验证自定义金额
		const isValidCustomAmount = computed(() => {
			return customAmount.value !== null && customAmount.value >= 2000 && Number.isInteger(customAmount.value)
		})

		// 当前是否可以发起请求
		const canCreateOrder = computed(() => {
			if (!isCustomMode.value) {
				return true
			}
			return isValidCustomAmount.value
		})

		const requestOrder = async () => {
			if (!canCreateOrder.value) {
				return
			}

			try {
				updating.value = true
				await createRechargeOrder()
			} finally {
				updating.value = false
			}
		}

		const triggerOrder = debounce(requestOrder, 300)

		onMounted(async () => {
			// 默认选中2000元
			selectedAmountType.value = 2000
			setCreatePayload({
				amount: 2000,
				channel: 'wechat',
				amountType: 'preset',
			})
			await requestOrder()
		})

		// 监听金额变化，只在验证通过时触发
		watch([() => createPayload.value.amount, () => canCreateOrder.value], ([newAmount, canCreate]) => {
			if (canCreate) {
				triggerOrder()
			}
		})

		// 处理下拉框选择变化
		const onSelectChange = (value: string | number) => {
			selectedAmountType.value = value

			if (typeof value === 'number') {
				// 选择预设金额
				customAmount.value = null
				setCreatePayload({
					...createPayload.value,
					amount: value,
					amountType: 'preset',
				})
			} else if (value === 'custom') {
				// 选择自定义模式，但不立即更新payload
				// 等待用户输入有效金额
			}
		}

		// 处理自定义金额输入
		const onCustomAmountChange = (value: number | null) => {
			customAmount.value = value

			// 实时更新payload（如果有效）
			if (value !== null && isCustomMode.value) {
				setCreatePayload({
					...createPayload.value,
					amount: value,
					amountType: 'custom',
				})
			}
		}

		// 处理自定义输入框失焦
		const onCustomInputBlur = () => {
			if (isCustomMode.value && isValidCustomAmount.value) {
				// 验证通过，触发接口请求
				triggerOrder()
			}
		}

		const onChannelChange = (v: 'wechat' | 'alipay') => setCreatePayload({ ...createPayload.value, channel: v })

		const qrLink = computed(() => (createPayload.value.channel === 'wechat' ? qrWxUrl.value : qrAliUrl.value) || '')

		return () => (
			<>
				<NAlert type="warning" showIcon>
					充值的金额可以在后台购买所有堡塔产品，包括但不限于linux专业版、linux企业版、windows专业版、windows企业版、云监控
				</NAlert>
				<NForm labelPlacement="left" class="p-4">
					<NFormItem label="充值金额">
						<NSpace>
							{/* 金额选择下拉框 */}
							<NSelect
								value={selectedAmountType.value}
								options={amountOptions}
								onUpdateValue={onSelectChange}
								style={{ width: '120px' }}
								placeholder="选择金额"
							/>

							{/* 自定义金额输入框 - 仅在选择自定义时显示 */}
							{isCustomMode.value && (
								<div style={{ display: 'inline-flex', alignItems: 'center' }}>
									<NInputNumber
										value={customAmount.value}
										onUpdateValue={onCustomAmountChange}
										onBlur={onCustomInputBlur}
										onFocus={(e: FocusEvent) => (e.target as HTMLInputElement).select()}
										placeholder="最低2000元"
										min={2000}
										precision={0}
										style={{ width: '140px' }}
										status={customAmount.value !== null && !isValidCustomAmount.value ? 'error' : undefined}
									/>
									<span style={{ marginLeft: '4px', fontSize: '14px', color: '#666' }}>元</span>
								</div>
							)}
						</NSpace>

						{/* 错误提示 */}
						{isCustomMode.value && customAmount.value !== null && !isValidCustomAmount.value && (
							<div style={{ color: '#d03050', fontSize: '12px', marginTop: '8px' }}>
								充值金额不能少于2000元，且必须为整数
							</div>
						)}
					</NFormItem>
					<NFormItem label="充值方式">
						<NRadioGroup
							value={createPayload.value.channel}
							onUpdateValue={(v) => onChannelChange(v as 'wechat' | 'alipay')}
						>
							<NRadioButton value="wechat">微信支付</NRadioButton>
							<NRadioButton value="alipay">支付宝</NRadioButton>
						</NRadioGroup>
					</NFormItem>
					<NFormItem label="">
						<div class="flex flex-1 justify-center">
							<div class="border-1 border-gray-300">
								{qrLink.value ? (
									<NQrCode value={qrLink.value} size={180} />
								) : (
									<span>
										{updating.value ? '生成中...' : !canCreateOrder.value ? '请输入有效的充值金额' : '请选择金额与方式'}
									</span>
								)}
							</div>
						</div>
					</NFormItem>
				</NForm>
			</>
		)
	},
})
