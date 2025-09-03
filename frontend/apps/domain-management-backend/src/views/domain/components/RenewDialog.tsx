import { defineComponent, computed } from 'vue'
import { NAlert, NButton, NFlex, NGrid, NGridItem, NQrCode, NRadioButton, NRadioGroup, NSelect, NTag, NSteps, NStep } from 'naive-ui'
import { useDomainState } from '../useStore'
import { useController } from '../useController'
import { formatDate } from '@baota/utils/date'

export default defineComponent({
	name: 'RenewDialog',
	props: { YEAR_OPTIONS: { type: Array as unknown as () => number[], default: () => [1,2,3,5,10] } },
	setup(props) {
		const state = useDomainState()
		const { changeRenewYear, switchRenewChannel, closeRenewModal, payRenewByBalance } = useController()
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
									<NSelect
										value={state.renewSelectedYear.value}
										onUpdateValue={(v) => changeRenewYear(Number(v))}
										options={props.YEAR_OPTIONS.map((y) => ({ label: `${y}年`, value: y }))}
										loading={state.renewLoading.value}
									/>
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