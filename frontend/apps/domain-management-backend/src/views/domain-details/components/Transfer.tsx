/**
 * 域名转移组件
 * 职责：处理堡塔账号间转移和域名转出功能
 */

import { defineComponent, type PropType } from 'vue'
import { NCard, NButton, NTag, NFlex, NText } from 'naive-ui'
import { useModal, useDialog } from '@baota/naive-ui/hooks'
import { useTransferOutController } from '@/views/transfer/components/Leave/useController'
import { useTransferOutState } from '@/views/transfer/components/Leave/useStore'
import { cancelInsideTransfer } from '@/api/transfer'
import { executeApiWithSecurityVerification } from '@/public/dialog'
import InsideTransferDialog from './InsideTransferDialog'
import type { DomainInfo } from '@/types/domain'

interface TransferProps {
	domainInfo: DomainInfo | null
	insideTransferStatus: any
	outsideTransferStatus: number | null
	onRefresh: () => void
}

export default defineComponent({
	name: 'Transfer',
	props: {
		domainInfo: {
			type: Object as PropType<DomainInfo>,
			default: null,
		},
		insideTransferStatus: {
			type: [Object, null] as PropType<any>,
			default: null,
		},
		outsideTransferStatus: {
			type: [Number, null] as PropType<number | null>,
			default: null,
		},
		onRefresh: {
			type: Function as PropType<() => void>,
			required: true,
		},
	},
	setup(props) {
		const { openTransferOutDialog } = useTransferOutController()
		const { handleCancelTransferOut } = useTransferOutState()
		const insideTransferModal = ref()
		const btInsideTransferModal = ref()

		// 判断域名注册是否满7天
		const isRegistrationOver7Days = computed(() => {
			if (!props.domainInfo?.register_time) return true

			// register_time 是秒级时间戳，需要转换为毫秒
			const registerTime = parseInt(String(props.domainInfo.register_time)) * 1000
			const currentTime = Date.now()
			const daysDiff = (currentTime - registerTime) / (1000 * 60 * 60 * 24)

			return daysDiff >= 7
		})

		// 打开堡塔账号间转移弹窗
		const openInsideTransferModal = () => {
			insideTransferModal.value = useModal({
				title: '堡塔账号间转移',
				area: '600px',
				component: InsideTransferDialog,
				componentProps: {
					domainId: props.domainInfo?.id,
					domainName: props.domainInfo?.full_domain,
					refresh: props.onRefresh,
					close: () => {
						insideTransferModal.value?.close()
					},
				},
				footer: false,
			})
		}

		// 查看转移进度（进入弹窗步骤三）
		const viewTransferProgress = () => {
			btInsideTransferModal.value = useModal({
				title: '堡塔账号间转移',
				area: '600px',
				component: InsideTransferDialog,
				componentProps: {
					domainId: props.domainInfo?.id,
					domainName: props.domainInfo?.full_domain,
					initialStep: 2, // 直接进入步骤三
					transferData: props.insideTransferStatus,
					refresh: props.onRefresh,
					close: () => {
						btInsideTransferModal.value?.close()
					},
				},
				footer: false,
			})
		}

		// 取消堡塔账号间转移
		const cancelInsideTransferAction = () => {
			useDialog({
				type: 'warning',
				title: '确认取消',
				area: '40',
				content: '确定要取消此转移申请吗？此操作不可恢复。',
				positiveText: '确定',
				negativeText: '取消',
				onPositiveClick: async () => {
					try {
						if (props.domainInfo?.id) {
							const info = await executeApiWithSecurityVerification(
								cancelInsideTransfer as any,
								{ domain_id: props.domainInfo!.id },
								{
									showMessage: true,
								},
							)
							if (info.status) props.onRefresh()
						}
					} catch (error) {
						console.error('取消转移失败:', error)
					}
				},
			})
		}

		// 取消域名转出
		const cancelOutsideTransfer = () => {
			useDialog({
				type: 'warning',
				title: '确认取消',
				area: '40',
				content: '确定要取消此转出申请吗？此操作不可恢复。',
				positiveText: '确定',
				negativeText: '取消',
				onPositiveClick: async () => {
					try {
						if (props.domainInfo?.id) {
							await handleCancelTransferOut(props.domainInfo.id)
							props.onRefresh()
						}
					} catch (error) {
						console.error('取消转出失败:', error)
					}
				},
			})
		}

		// 判断是否处于转移状态
		const isInsideTransferring = () => props.insideTransferStatus !== null
		const isOutsideTransferring = () => props.outsideTransferStatus === 1

		return () => (
			<div class="transfer-container">
				<NFlex vertical size="large">
					{/* 堡塔账号间转移 */}
					<NCard
						title="堡塔账号间转移"
						class={`card-shadow ${isOutsideTransferring() ? 'opacity-50 pointer-events-none' : ''}`}
						bordered={false}
					>
						<NFlex vertical size="medium">
							<NText class="text-gray-600">将域名转移到其他堡塔账号，转移后域名的管理权限将移交给目标账号。</NText>

							<NFlex align="center" justify="space-between">
								<NFlex align="center" size="medium">
									{isInsideTransferring() ? (
										<>
											<NButton type="default" style={{ width: '200px' }} onClick={viewTransferProgress}>
												查看进度
											</NButton>
											<NTag type="warning" bordered={false}>
												等待确认
											</NTag>
											<NButton type="error" size="small" onClick={cancelInsideTransferAction}>
												取消转出
											</NButton>
										</>
									) : (
										<NButton
											type="primary"
											style={{ width: '200px' }}
											onClick={openInsideTransferModal}
											disabled={isOutsideTransferring() || !isRegistrationOver7Days.value}
										>
											发起转移
										</NButton>
									)}
									{isOutsideTransferring() && <span>域名转出进行中</span>}
									{!isRegistrationOver7Days.value && !isOutsideTransferring() && (
										<span>域名注册未满7天，暂不能发起转移</span>
									)}
								</NFlex>
							</NFlex>
						</NFlex>
					</NCard>

					{/* 域名转出 */}
					<NCard
						title="域名转出"
						class={`card-shadow ${isInsideTransferring() ? 'opacity-50 pointer-events-none' : ''}`}
						bordered={false}
					>
						<NFlex vertical size="medium">
							<NText class="text-gray-600">将域名转移到其他注册商，转移前请确保域名已解锁且获取转移密码。</NText>

							<NFlex align="center" justify="space-between">
								<NFlex align="center" size="medium">
									{isOutsideTransferring() ? (
										<>
											<NButton type="default" style={{ width: '200px' }} onClick={cancelOutsideTransfer}>
												取消转出
											</NButton>
											<NTag type="info" bordered={false}>
												转移中
											</NTag>
										</>
									) : (
										<NButton
											type="primary"
											style={{ width: '200px' }}
											onClick={openTransferOutDialog}
											disabled={isInsideTransferring()}
										>
											发起转出
										</NButton>
									)}
									{isInsideTransferring() && <span>堡塔账号转移进行中</span>}
								</NFlex>
							</NFlex>
						</NFlex>
					</NCard>
				</NFlex>
			</div>
		)
	},
})
