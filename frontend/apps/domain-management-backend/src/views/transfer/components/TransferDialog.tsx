import { defineComponent, computed, onUnmounted } from 'vue'
import { NButton, NFlex, NGrid, NGridItem, NInput, NInputGroup, NSteps, NStep, NSelect, NCheckbox, NRadioButton, NRadioGroup, NTag, NQrCode, NDynamicInput, NAlert, NTooltip, NIcon } from 'naive-ui'
import { useTransferState } from '../useStore'
import { useController } from '../useController'
import { queryPaymentStatus, buyByBalance } from '@/api/order'
import { useMessage } from '@baota/naive-ui/hooks'
import { InformationCircleOutline } from '@vicons/ionicons5'
import { RefreshFilled } from '@vicons/material'

export default defineComponent({
	name: 'TransferDialog',
	props:{
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
		const state = useTransferState()
		const { checkDomains, createOrder, handleSelectRealName, loadRealNameOptions } = useController()
		const message = useMessage()
		const qrLink = computed(() => state.payChannel.value === 'wechat' ? state.orderInfo.value?.wx : state.orderInfo.value?.ali)
		const canPayByBalance = computed(() => Number(state.balanceAvailable.value || 0) >= Number(state.orderInfo.value?.total_price || 0))

		// 轮询定时器
		let pollTimer: any = null

		// 停止轮询
		const stopPolling = () => {
			if (pollTimer) {
				clearInterval(pollTimer)
				pollTimer = null
			}
		}

		// 启动轮询
		const startPolling = (orderNo: string) => {
			if (!orderNo) return
			stopPolling()
			let count = 0
			const maxCount = 60
			pollTimer = setInterval(async () => {
				count++
				try {
					const { fetch, data } = queryPaymentStatus({ order_no: orderNo })
					await fetch()
					const paid = Number(data.value?.data?.status ?? 0) === 1
					if (paid) {
						stopPolling()
						message.success('支付成功，域名转入一般需要 3~7个工作日，具体取决于注册局审核时间。')
						props.close()
						props.refresh()
						return
					}
					if (count >= maxCount) stopPolling()
				} catch {
					if (count >= maxCount) stopPolling()
				}
			}, 3000)
		}

		// 切换支付方式
		const switchPayChannel = (c: 'balance' | 'wechat' | 'alipay') => {
			state.payChannel.value = c
			const orderNo = state.orderInfo.value?.order_no || ''
			if (c === 'balance') stopPolling()
			else if (orderNo && !pollTimer) startPolling(orderNo)
		}

		// 组件卸载时清理轮询
		onUnmounted(() => {
			stopPolling()
		})

		// 本地创建订单函数，处理轮询逻辑
		const handleCreateOrder = async () => {
			await createOrder()
			// 如果是第三方支付且有订单号，启动轮询
			if (state.payChannel.value !== 'balance' && state.orderInfo.value?.order_no) {
				startPolling(state.orderInfo.value.order_no)
			}
		}

		// 本地余额支付函数
		const handlePayByBalance = async () => {
			const orderNo = state.orderInfo.value?.order_no || ''
			if (!orderNo) {
				message.error('未找到订单号')
				return
			}
			const need = Number(state.orderInfo.value?.total_price || 0)
			const has = Number(state.balanceAvailable.value || 0)
			if (has < need) {
				message.warning('余额不足，请先充值')
				return
			}
			const { fetch, data } = buyByBalance({ order_no: orderNo })
			await fetch()
			if (!data.value?.status) {
				message.error(data.value?.msg || '支付失败')
				return
			}
			stopPolling()
			message.success('支付成功，域名转入一般需要 3~7个工作日，具体取决于注册局审核时间。')
			props.close()
			props.refresh()
		}



		// 处理提交逻辑
		const handleCheckDomains = () => {
			// 调用原有的检查逻辑
			checkDomains()
		}

		const renderStep1 = () => (
			<NGrid cols="1" xGap={12} yGap={16}>
				{/* 输入区域 */}
				<NGridItem class="flex items-start gap-4">
					<div class="text-gray-500 text-sm whitespace-nowrap mt-1">域名和转移码</div>
					<NDynamicInput
						value={state.rows.value as any}
						onUpdateValue={(v) => {
							state.rows.value = v as Array<{ domain: string; transfer_code: string }>
							// 确保验证数组长度一致
							const newRows = v as Array<{ domain: string; transfer_code: string }>
							while (state.rowValidation.value.length < newRows.length) {
								state.rowValidation.value.push({ domainError: '', transferCodeError: '' })
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
												status={state.rowValidation.value[index]?.domainError ? 'error' : undefined}
												onUpdateValue={(v) => {
													state.setRowField(index, 'domain', v)
												}}
												onBlur={() => state.validateRow(index, 'domain', value.domain)}
											/>
											{state.rowValidation.value[index]?.domainError && (
												<div class="text-red-500 text-xs mt-1 px-1">{state.rowValidation.value[index].domainError}</div>
											)}
										</div>

										<div class="w-40">
											<NInput
												placeholder="请输入转移码"
												value={value.transfer_code}
												status={state.rowValidation.value[index]?.transferCodeError ? 'error' : undefined}
												onUpdateValue={(v) => {
													state.setRowField(index, 'transfer_code', v)
												}}
												onBlur={() => state.validateRow(index, 'transfer_code', value.transfer_code)}
											/>
											{state.rowValidation.value[index]?.transferCodeError && (
												<div class="text-red-500 text-xs mt-1 px-1">
													{state.rowValidation.value[index].transferCodeError}
												</div>
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
						<NButton type="primary" disabled={!state.isFormValid.value} onClick={() => handleCheckDomains()}>
							立即转入
						</NButton>
					</NFlex>
				</NGridItem>
			</NGrid>
		)

		const renderPriceTable = () => (
			<div class="mt-2">
				<div class="mb-2 text-sm text-gray-700">
					<div class="font-bold">查询结果</div>
					可转入 {state.transferPriceList.value.length} 个域名，预计累计费用 {Number(state.transferPriceTotal.value || 0)} 元
				</div>
				<div class="border rounded max-h-[160px] overflow-y-auto">
					<div class="grid grid-cols-2 bg-gray-50 text-gray-600 text-sm p-2">
						<div>域名</div>
						<div class="flex items-center">
							价格
							<NTooltip trigger="hover">
								{{
									default: () => '转入的价格为该域名续费一年的费用，转入后会增加域名1年期限。',
									trigger: () => (
										<NIcon class="flex justify-center cursor-pointer ml-1">
											<InformationCircleOutline />
										</NIcon>
									),
								}}
							</NTooltip>
						</div>
					</div>
					{state.transferPriceList.value.map((it) => (
						<div class="grid grid-cols-2 p-2 border-t" key={it.domain}>
							<div>{it.domain}</div>
							<div>
								{it.error ? (
									<span class="text-red-500">{it.error}</span>
								) : (
									<span>{Number(it.price || 0)} 元</span>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		)

		const renderStep2 = () => (
			<NGrid cols="1" xGap={12} yGap={10}>
				<NGridItem>
					{state.transferPriceLoading.value ? (
						<NAlert type="info" showIcon title="正在查询价格..." />
					) : (
						renderPriceTable()
					)}
				</NGridItem>
				<NGridItem>
					<div class="flex items-center justify-between">
						<div class="text-gray-500 mb-1">域名实名认证模板</div>
						<div class="flex text-xs">
							<span class=" text-gray-500">当前仅显示已通过的实名模板</span>
							<NButton ghost text size="tiny" onClick={() => loadRealNameOptions()}>
								{{
									default: () => (
										<>
											<NIcon class="flex cursor-pointer ml-1" size={16}>
												<RefreshFilled />
											</NIcon>
											<span>刷新实名列表</span>
										</>
									),
								}}
							</NButton>
						</div>
					</div>
					<NSelect
						value={state.selectedTemplateId.value as any}
						onUpdateValue={(v) => handleSelectRealName(Number(v))}
						options={[...state.realNameOptions.value, { label: '创建实名模板…', value: -1 }]}
						placeholder="请选择实名模板"
					/>
				</NGridItem>
				<NGridItem>
					<NCheckbox checked={state.agree.value} onUpdateChecked={(v) => (state.agree.value = !!v)}>
						我已阅读并同意相关协议
						<a
							class="text-[#20a53a] hover:text-[#20a53a]-800 text-sm underline cursor-pointer"
							href="https://www.bt.cn/new/agreement_domain_register.html"
							rel="noopener noreferrer"
							target="_blank"
						>
							《域名转入协议》
						</a>
					</NCheckbox>
				</NGridItem>
				<NGridItem>
					<NFlex justify="end" class="mt-2">
						<NButton class="mr-2" onClick={() => state.setStep(1)}>
							上一步
						</NButton>
						<NButton type="primary" onClick={() => handleCreateOrder()}>
							提交订单
						</NButton>
					</NFlex>
				</NGridItem>
			</NGrid>
		)

		const renderStep3 = () => (
			<NGrid cols="1" xGap={12} yGap={20}>
				<NGridItem>
					<div class="text-sm text-gray-700">订单信息：域名数量 {state.rows.value.filter(r => r.domain && r.transfer_code).length} 个，总金额：¥{Number(state.orderInfo.value?.total_price || 0).toFixed(2)}</div>
				</NGridItem>
				<NGridItem class="flex items-center">
					<strong class="text-sm mr-4">选择支付方式</strong>
					<NRadioGroup value={state.payChannel.value} size="small" onUpdateValue={(v) => switchPayChannel(v as any)}>
						<NRadioButton value="wechat">微信支付</NRadioButton>
						<NRadioButton value="alipay">支付宝</NRadioButton>
						<NRadioButton value="balance">余额支付</NRadioButton>
					</NRadioGroup>
				</NGridItem>
				<NGridItem>
					{state.payChannel.value !== 'balance' ? (
						<NFlex vertical align="center">
							<NQrCode value={qrLink.value || ''} size={180} />
							<div class="text-xs text-gray-600 mt-2">请使用{state.payChannel.value === 'wechat' ? '微信' : '支付宝'}扫码支付</div>
						</NFlex>
					) : (
						<NFlex vertical align="center" class="py-3">
							<NTag type={canPayByBalance.value ? 'success' : 'warning'} bordered={false}>
								可用余额：¥{Number(state.balanceAvailable.value || 0).toFixed(2)} / 需支付：¥{Number(state.orderInfo.value?.total_price || 0).toFixed(2)}
							</NTag>
							<NButton type="primary" disabled={!canPayByBalance.value} onClick={() => handlePayByBalance()}>立即支付</NButton>
						</NFlex>
					)}
				</NGridItem>
			</NGrid>
		)

		return () => (
			<div class="p-2">
				<NSteps current={state.transferStep.value} status="process" class="mb-6">
					<NStep title="查询域名">
						<div>输入域名和转移码</div>
					</NStep>
					<NStep title="提交订单">
						<div>选择实名模板</div>
					</NStep>
					<NStep title="支付">
						<div>选择支付方式</div>
					</NStep>
				</NSteps>
				{state.transferStep.value === 1
					? renderStep1()
					: state.transferStep.value === 2
						? renderStep2()
						: renderStep3()}
			</div>
		)
	},
}) 