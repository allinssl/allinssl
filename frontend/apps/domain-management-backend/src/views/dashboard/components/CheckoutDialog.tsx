import { defineComponent } from 'vue'
import {
	NButton,
	NFlex,
	NGrid,
	NGridItem,
	NQrCode,
	NRadioButton,
	NRadioGroup,
	NSelect,
	NSpace,
	NTag,
	NText,
} from 'naive-ui'
import { useDashboardState } from '../useStore'
import { useDashboardController } from '../useController'

export default defineComponent({
	name: 'CheckoutDialogContent',
	setup() {
		const state = useDashboardState()
		const { createOrderAndInitPay, handleSelectRealName, switchCheckoutPayChannel, payCartByBalance } = useDashboardController()

		const renderStep1 = () => (
			<>
				<NSpace vertical size={12}>
					<NSelect
						value={state.selectedRealNameId.value as any}
						onUpdateValue={(v) => handleSelectRealName(v as number)}
						options={[...state.realNameOptions.value, { label: '创建实名模板…', value: -1 }]}
						placeholder="请选择实名模板"
						loading={state.checkoutLoading.value}
					/>
					<div class="text-xs text-gray-500">若没有合适的模板，可先创建后再选择。</div>
				</NSpace>
				<div class="mt-4 text-right">
					<NButton
						type="primary"
						disabled={!state.selectedRealNameId.value}
						loading={state.checkoutLoading.value}
						onClick={() => createOrderAndInitPay()}
					>
						下一步
					</NButton>
				</div>
			</>
		)

		const renderPayHeader = () => (
			<>
				<strong class="text-sm mr-4">支付方式：</strong>
				<NRadioGroup value={state.payChannel.value} onUpdateValue={(v) => switchCheckoutPayChannel(v as any)}>
					<NRadioButton value="wechat">微信</NRadioButton>
					<NRadioButton value="alipay">支付宝</NRadioButton>
					<NRadioButton value="balance">余额支付</NRadioButton>
				</NRadioGroup>
			</>
		)
		const qrLink = computed(() => state.payChannel.value === 'wechat' ? state.orderPayInfo.value?.wx : state.orderPayInfo.value?.ali)
		const renderPayBody = () => {
			const info = state.orderPayInfo.value
			if (!info) return null
			if (state.payChannel.value !== 'balance') {
				return (
					<NFlex vertical align="center" class="py-3">
						<div class="text-sm">支付金额：¥{Number(state.orderPayInfo.value?.total_price || 0).toFixed(2)}</div>
						<NQrCode value={qrLink.value || ''} size={180} />
						<NText depth={3} class="mt-2 text-sm">请使用{state.payChannel.value === 'wechat' ? '微信' : '支付宝'}扫码支付</NText>
					</NFlex>
				)
			}
			const canPay = Number(state.balanceAvailable.value || 0) >= Number(info.total_price || 0)
			return (
				<NSpace vertical size={10} class="py-2">
					<NTag type={canPay ? 'success' : 'warning'} bordered={false}>
						可用余额：¥{Number(state.balanceAvailable.value || 0).toFixed(2)} / 需支付：¥{Number(info.total_price || 0).toFixed(2)}
					</NTag>
					<NButton type="primary" disabled={!canPay} onClick={() => payCartByBalance()}>
						立即支付
					</NButton>
					{!canPay ? (
						<NText class="text-red-500 text-sm">余额不足，请先充值</NText>
					) : null}
				</NSpace>
			)
		}

		const renderStep2 = () => (
				<NGrid cols="1" xGap={16} responsive="screen">
					<NGridItem>
						{renderPayHeader()}
						{renderPayBody()}
					</NGridItem>
				</NGrid>
		)

		return () => (
			<div class="p-1">
				{state.checkoutStep.value === 1 ? renderStep1() : renderStep2()}
			</div>
		)
	},
}) 