import { defineComponent, computed, ref } from 'vue'
import { NAlert, NButton, NFlex, NGrid, NGridItem, NQrCode, NRadioButton, NRadioGroup, NSelect, NTag, NSteps, NStep, NInputNumber, NSpace } from 'naive-ui'
import { useDomainState } from '../useStore'
import { useController } from '../useController'
import { formatDate } from '@baota/utils/date'

export default defineComponent({
	name: 'RenewDialog',
	props: { YEAR_OPTIONS: { type: Array as unknown as () => number[], default: () => [1,2,3,5] } },
	setup(props) {
		const state = useDomainState()
		const { changeRenewYear, switchRenewChannel, closeRenewModal, payRenewByBalance } = useController()
		
		// 自定义年限状态管理
		const customYear = ref<number | null>(null)
		const selectedYearType = ref<string | number>(state.renewSelectedYear.value)
		const isQueryingPrice = ref(false) // 防止重复查询的标志位
		
		// 生成下拉框选项（预设年份 + 自定义）
		const yearSelectOptions = [
			...props.YEAR_OPTIONS.map(year => ({ 
				label: `${year}年`, 
				value: year 
			})),
			{ label: '自定义', value: 'custom' }
		]
		
		// 当前是否为自定义模式
		const isCustomMode = computed(() => selectedYearType.value === 'custom')
		
		// 验证自定义年份
		const isValidCustomYear = computed(() => {
			return customYear.value !== null && 
				   customYear.value >= 1 && 
				   customYear.value <= 10 &&
				   Number.isInteger(customYear.value)
		})
		
		// 处理下拉框选择变化
		const onYearSelectChange = (value: string | number) => {
			selectedYearType.value = value
			
			if (typeof value === 'number') {
				// 选择预设年份
				customYear.value = null
				changeRenewYear(value)
			} else if (value === 'custom') {
				// 选择自定义模式
				if (customYear.value && isValidCustomYear.value) {
					changeRenewYear(customYear.value)
				}
			}
		}
		
		// 查询价格的核心逻辑
		const queryCustomPrice = async () => {
			if (customYear.value !== null && isValidCustomYear.value && !isQueryingPrice.value) {
				isQueryingPrice.value = true
				try {
					await changeRenewYear(customYear.value)
				} finally {
					// 短暂延迟后重置标志位，防止快速重复调用
					setTimeout(() => {
						isQueryingPrice.value = false
					}, 100)
				}
			}
		}
		
		// 处理自定义年限输入
		const onCustomYearChange = (value: number | null) => {
			customYear.value = value
			// 输入过程中不立即查询价格，避免频繁调用接口
		}
		
		// 处理自定义输入框失焦
		const onCustomYearBlur = () => {
			// 只在失焦时查询一次价格
			void queryCustomPrice()
		}
		
		// 处理回车键确认
		const onCustomYearKeyup = (e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				// 先查询价格
				void queryCustomPrice()
				// 然后让输入框失去焦点，但防重复调用机制会阻止重复查询
				;(e.target as HTMLInputElement)?.blur()
			}
		}
		
		const qrLink = computed(() => state.renewPayChannel.value === 'wechat' ? state.renewOrderInfo.value?.wx : state.renewOrderInfo.value?.ali)
		const canPayByBalance = computed(() => Number(state.renewBalanceAvailable.value || 0) >= Number(state.renewOrderInfo.value?.total_price || 0))

		const priceToShow = computed(() => {
			const p = state.renewPriceInfo.value
			console.log(p,'--');
			if (!p) return 0
			const num = Number(p.discount_price || p.price || 0)
			return isNaN(num) ? 0 : num
		})

		return () => (
			<div class="p-2">
				{/* 顶部步骤指示（NSteps） */}
				<NSteps current={state.renewStep.value} status="process" class="mb-8">
					<NStep title="确认续费年限" />
					<NStep title="选择支付方式" />
				</NSteps>

				<NAlert type="info" class="mb-3" showIcon>
					{state.renewStep.value === 1 ? '请确认域名续费信息' : '请选择支付方式完成续费'}
				</NAlert>
				{state.renewStep.value === 1 ? (
					<NGrid cols="1" xGap={12} yGap={10}>
						<NGridItem>
							<div class="grid grid-cols-3 gap-2 items-center">
								<div class="text-gray-500">域名</div>
								<div class="col-span-2">{state.renewCurrentDomain.value?.full_domain || ''}</div>
								<div class="text-gray-500">当前到期时间</div>
								<div class="col-span-2">
									{formatDate(state.renewCurrentDomain.value?.expire_time || 0, 'yyyy-MM-dd')}
								</div>
								<div class="text-gray-500">续费年限</div>
								<div class="col-span-2">
									<NSpace>
										{/* 年限选择下拉框 */}
									<NSelect
											value={selectedYearType.value}
											onUpdateValue={onYearSelectChange}
											options={yearSelectOptions}
										loading={state.renewLoading.value}
											style={{ width: '100px' }}
											placeholder="选择年限"
										/>
										
										{/* 自定义年限输入框 - 同层显示 */}
										{isCustomMode.value && (
											<div style={{ display: 'inline-flex', alignItems: 'center' }}>
												<NInputNumber
													value={customYear.value}
													onUpdateValue={onCustomYearChange}
													onBlur={onCustomYearBlur}
													onFocus={(e: FocusEvent) => (e.target as HTMLInputElement).select()}
													placeholder="1-10年"
													min={1}
													max={10}
													precision={0}
													style={{ width: '120px' }}
													status={customYear.value !== null && !isValidCustomYear.value ? 'error' : undefined}
													inputProps={{
														onKeyup: onCustomYearKeyup
													}}
												/>
												<span style={{ marginLeft: '4px', fontSize: '14px', color: '#666' }}>年</span>
											</div>
										)}
									</NSpace>
									
									{/* 错误提示 */}
									{isCustomMode.value && customYear.value !== null && !isValidCustomYear.value && (
										<div style={{ color: '#d03050', fontSize: '12px', marginTop: '8px' }}>
											续费年限必须为1-10年的整数
										</div>
									)}
								</div>
								<div class="text-gray-500">续费价格</div>
								<div class="col-span-2 text-red-500 font-medium">¥{priceToShow.value.toFixed(2)}</div>
								<div class="text-gray-500">续费后到期时间</div>
								<div class="col-span-2">{state.renewNewExpireDate.value || '-'}</div>
							</div>
							<div class="mt-4 text-right">
								<NButton onClick={() => closeRenewModal()} class="mr-2">
									取消
								</NButton>
								<NButton
									type="primary"
									disabled={state.renewLoading.value}
									onClick={() => {
										// 进入下一步需要创建订单：通过控制器 doRenew
										const domain = state.renewCurrentDomain.value?.full_domain || ''
										if (domain) (useController() as any).doRenew(domain, state.renewSelectedYear.value)
									}}
								>
									下一步
								</NButton>
							</div>
						</NGridItem>
					</NGrid>
				) : (
					<NGrid cols="1" xGap={12} yGap={20}>
						<NGridItem>
							<div class="grid grid-cols-3 gap-2 items-center">
								<div class="text-gray-500">域名</div>
								<div class="col-span-2">{state.renewCurrentDomain.value?.full_domain || ''}</div>
								<div class="text-gray-500">续费年限</div>
								<div class="col-span-2">{state.renewSelectedYear.value}年</div>
								<div class="text-gray-500">续费金额</div>
								<div class="col-span-2 text-red-500 font-medium">
									¥{Number(state.renewOrderInfo.value?.total_price || 0).toFixed(2)}
								</div>
							</div>
						</NGridItem>

						<NGridItem class="flex items-center">
							<strong class="text-sm mr-4">选择支付方式</strong>
							<NRadioGroup
								value={state.renewPayChannel.value}
								size="small"
								onUpdateValue={(v) => switchRenewChannel(v as any)}
							>
								<NRadioButton value="wechat">微信支付</NRadioButton>
								<NRadioButton value="alipay">支付宝</NRadioButton>
								<NRadioButton value="balance">余额支付</NRadioButton>
							</NRadioGroup>
						</NGridItem>

						<NGridItem>
							{state.renewPayChannel.value !== 'balance' ? (
								<NFlex vertical align="center">
									<NQrCode value={qrLink.value || ''} size={180} />
									<div class="text-xs text-gray-600">
										请使用{state.renewPayChannel.value === 'wechat' ? '微信' : '支付宝'}扫码支付
									</div>
								</NFlex>
							) : (
								<NFlex vertical align="center" class="py-3">
									<NTag type={canPayByBalance.value ? 'success' : 'warning'} bordered={false}>
										可用余额：¥{Number(state.renewBalanceAvailable.value || 0).toFixed(2)} / 需支付：¥
										{Number(state.renewOrderInfo.value?.total_price || 0).toFixed(2)}
									</NTag>
									<NButton type="primary" disabled={!canPayByBalance.value} onClick={() => payRenewByBalance()}>
										立即支付
									</NButton>
								</NFlex>
							)}
						</NGridItem>
					</NGrid>
				)}
			</div>
		)
	},
}) 