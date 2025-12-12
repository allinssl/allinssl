/**
 * 域名安全组件
 * 职责：展示域名锁定状态和安全服务配置
 */

import { defineComponent, ref, PropType, computed } from 'vue'
import { NCard, NGrid, NGridItem, NSwitch, NButton, NText, NIcon, NTag } from 'naive-ui'
import { ShieldCheckmarkOutline, SettingsOutline } from '@vicons/ionicons5'
import { useApp } from '@/components/layout/useStore'
import { setDomainSecurity } from '@/api/domain'
import { useMessage, useModal } from '@baota/naive-ui/hooks'
import { formatDate } from '@baota/utils/date'
import { useError } from '@baota/hooks/error'
import { useDomainDetailState } from '../useStore'
import DnssecManagement from './DnssecMgt'
import type { DomainInfo, PrivacyInfo } from '@/types/domain'
import { executeApiWithSecurityVerification } from '@/public/dialog'

interface SecurityProps {
	domainId: number
	domainInfo?: DomainInfo | null
	privacyInfo?: PrivacyInfo | null
	loading?: boolean
	onRefresh?: () => void
}

export default defineComponent({
	name: 'DomainSecurity',
	props: {
		domainId: {
			type: Number,
			required: true,
		},
		domainInfo: {
			type: Object as PropType<DomainInfo | null>,
			default: null,
		},
		privacyInfo: {
			type: Object as PropType<PrivacyInfo | null>,
			default: null,
		},
		loading: {
			type: Boolean,
			default: false,
		},
		onRefresh: {
			type: Function as PropType<() => void>,
			default: () => {},
		},
	},
	setup(props: SecurityProps) {
		const { isMobile } = useApp()
		const { handleError } = useError()
		const { openPrivacyDialog } = useDomainDetailState()

		// 域名锁定状态
		const transferLock = ref(props.domainInfo?.transfer_lock === 1)
		const updateLock = ref(props.domainInfo?.update_lock === 1)

		// DNSSEC状态
		const dnssecEnabled = ref(false)

		// 加载状态
		const transferLockLoading = ref(false)
		const updateLockLoading = ref(false)

		// 隐私保护状态
		const isPrivacy = computed(() => {
			return !!props.domainInfo?.privacy
		})

		// 切换禁止转移锁
		const handleTransferLockChange = async (value: boolean) => {
			const info = await executeApiWithSecurityVerification(
				setDomainSecurity as any,
				{
					domain_id: props.domainId,
					type: 'transfer',
					status: value ? 1 : 0,
				},
				{
					showMessage: true,
					setLoading: (load: boolean) => {
						transferLockLoading.value = load
					},
				},
			)
			if (info?.status) {
				transferLock.value = value
				const message = useMessage()
				message.success(value ? '禁止转移锁已开启' : '禁止转移锁已关闭')
				props.onRefresh?.()
			}
		}

		// 切换禁止更新锁
		const handleUpdateLockChange = async (value: boolean) => {
			const info = await executeApiWithSecurityVerification(
				setDomainSecurity as any,
				{
					domain_id: props.domainId,
					type: 'update',
					status: value ? 1 : 0,
				},
				{
					showMessage: true,
					setLoading: (load: boolean) => {
						updateLockLoading.value = load
					},
				},
			)
			if (info.status) {
				updateLock.value = value
				const message = useMessage()
				message.success(value ? '禁止更新锁已开启' : '禁止更新锁已关闭')
				props.onRefresh?.()
			}
		}

		// 管理DNSSEC
		const handleManageDnssec = () => {
			useModal({
				title: 'DNSSEC管理',
				area: '900px',
				component: DnssecManagement,
				componentProps: {
					domainId: props.domainId,
					domainName: props.domainInfo?.full_domain || '',
					visible: true,
					onClose: () => {},
				},
				footer: false,
			})
		}

		// 打开域名隐私保护弹窗
		const openCnDomainPrivacyModal = () => {
			if (props.domainInfo) {
				openPrivacyDialog.value = useModal({
					title: '.CN/.中国专属域名隐私保护',
					area: '600px',
					component: () => import('./PrivacyProtection'),
					componentProps: {
						domain: props.domainInfo,
						privacy: props.privacyInfo,
						refresh: props.onRefresh,
						onClose: () => {
							openPrivacyDialog.value?.close()
						},
					},
					footer: false,
				})
			}
		}

		// 渲染信息项
		const renderInfoItem = (label: string, value: any, valueType: 'text' | 'switch' = 'text', config?: any) => {
			if (props.loading) {
				return (
					<div class="mb-2 flex items-center justify-between h-10">
						<div class="text-gray-500 font-bold w-25 mr-5 ml-1">{label}</div>
						<div class="w-8 h-4 bg-gray-200 rounded animate-pulse"></div>
					</div>
				)
			}

			if (valueType === 'switch') {
				return (
					<div class="mb-2 flex items-center justify-between h-10 hover:bg-gray-100">
						<div class="text-gray-500 font-bold w-25 mr-5 ml-1">{label}</div>
						<NSwitch
							value={value}
							onUpdateValue={config?.onChange}
							loading={config?.loading}
							disabled={props.loading}
						/>
					</div>
				)
			}

			return (
				<div class="mb-2 flex items-center justify-between h-10 hover:bg-gray-100">
					<div class="text-gray-500 font-bold w-25 mr-5 ml-1">{label}</div>
					<div>{value || '-'}</div>
				</div>
			)
		}
		return () => (
			<div class="py-2">
				<NGrid cols="1 m:2" xGap="16" yGap="16" responsive="screen">
					{/* 域名锁定 */}
					<NGridItem>
						<NCard title="域名锁定" header-style="font-size:16px;font-weight:500" class="h-full">
							{renderInfoItem('禁止转移锁', transferLock.value, 'switch', {
								onChange: handleTransferLockChange,
								loading: transferLockLoading.value,
							})}
							<div class="pl-2 mb-4 text-sm text-gray-600">防止域名被恶意转移到其他注册商</div>

							{renderInfoItem('禁止更新锁', updateLock.value, 'switch', {
								onChange: handleUpdateLockChange,
								loading: updateLockLoading.value,
							})}
							<div class="pl-2 text-sm text-gray-600">防止域名信息被恶意修改</div>
						</NCard>
					</NGridItem>

					{/* 安全服务 */}
					<NGridItem>
						<NCard title="安全服务" header-style="font-size:16px;font-weight:500" class="h-full">
							<div class="mb-2 flex items-center justify-between h-10 hover:bg-gray-100">
								<div class="text-gray-500 font-bold w-25 mr-5 ml-1">DNSSEC</div>
								<NButton type="primary" size="small" onClick={handleManageDnssec} disabled={props.loading}>
									管理DNSSEC
								</NButton>
							</div>
							<div class="pl-2 mb-4 text-sm text-gray-600">DNS安全扩展，防止DNS劫持和缓存投毒</div>

							{/* 隐私保护 - 仅对.cn和.中国域名显示 */}
							{(props.domainInfo?.suffix === 'cn' || props.domainInfo?.suffix === '中国') && (
								<>
									<div class="mb-2 flex items-center justify-between h-10 hover:bg-gray-100">
										<div class="text-gray-500 font-bold w-40 mr-5 ml-1 whitespace-nowrap">
											.CN/.中国专属域名隐私保护
										</div>
										<div class="flex items-center gap-2">
											<NTag type={isPrivacy.value ? 'success' : 'warning'} bordered={false}>
												{isPrivacy.value
													? `已开启(到期:${formatDate(props.privacyInfo?.end_time, 'yyyy-MM-dd')})`
													: '未开启'}
											</NTag>
											<NButton type="primary" size="small" onClick={openCnDomainPrivacyModal} disabled={props.loading}>
												{isPrivacy.value ? '延续隐私保护' : '开启保护'}
											</NButton>
										</div>
									</div>
									<div class="pl-2 mb-4 text-sm text-gray-600">隐藏域名注册信息，保护个人隐私</div>
								</>
							)}
						</NCard>
					</NGridItem>
				</NGrid>
			</div>
		)
	},
})
