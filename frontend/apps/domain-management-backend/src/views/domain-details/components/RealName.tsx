/**
 * 域名详情 - 实名认证组件
 * 职责：展示域名的实名认证信息和状态
 */

import { defineComponent, ref, computed } from 'vue'
import { NCard, NGrid, NGridItem, NText, NSkeleton, NAlert, NIcon, NFlex, NButton, NDivider } from 'naive-ui'
import { CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-vue-next'
import { formatDate } from '@baota/utils/date'
import { useController } from '../useController'

/**
 * 实名状态映射配置
 */
const REAL_NAME_STATUS_CONFIG = {
	0: {
		type: 'warning',
		text: '未实名',
		icon: AlertTriangle,
		description: '域名尚未完成实名认证，请尽快完成实名认证以确保域名正常使用',
	},
	1: {
		type: 'warning',
		text: '审核中',
		icon: AlertTriangle,
		description: '域名实名认证正在审核中，请耐心等待',
	},
	2: {
		type: 'success',
		text: '已通过',
		icon: CheckCircle,
		description: '域名已完成实名认证，可以正常使用所有功能',
	},
	3: {
		type: 'error',
		text: '实名失败',
		icon: XCircle,
		description: '域名实名认证审核失败，请检查认证信息并重新提交',
	},
}

/**
 * 域名实名认证组件
 */
export default defineComponent({
	name: 'DomainRealName',
	props: {
		domainId: {
			type: Number,
			required: true,
		},
	},
	setup(props) {
		// 显示警告提示
		const showAlert = ref(true)
		const { domainInfo, realNameInfo, loading, realNameInfoUpdating, openTemplateChangeModal, refreshDomainInfo } = useController(props.domainId)

		// 计算加载状态
		const isRealNameUpdating = computed(() => {
			return realNameInfoUpdating.value !== null && 
			       typeof realNameInfoUpdating.value === 'object';
		})

		// 计算实名状态配置
		const realNameStatus = computed(() => {
			if (!realNameInfo.value) return REAL_NAME_STATUS_CONFIG[0]
			return REAL_NAME_STATUS_CONFIG[realNameInfo.value.status as keyof typeof REAL_NAME_STATUS_CONFIG]
		})

		// 渲染信息项
		const renderInfoItem = (label: string, value: any) => {
			if (loading.value) {
				return (
					<div class="mb-2 flex items-center  h-10  hover:bg-gray-100">
						<div class="text-gray-500 font-bold mb-1">{label}</div>
						<NSkeleton text width="60%" />
					</div>
				)
			}

			return (
				<div class="mb-2 flex items-center  h-10  hover:bg-gray-100">
					<div class="text-gray-500 font-bold w-25 mr-5 ml-1 flex-shrink-0">{label}</div>
					<div>{value || '-'}</div>
				</div>
			)
		}

		return () => (
			<div class="mt-4">
				{/* 实名认证状态 */}
				<div class="mb-6">
					<NFlex align="center">
						<NIcon
							size={24}
							color={
								realNameStatus.value?.type === 'success'
									? '#18a058'
									: realNameStatus.value?.type === 'warning'
										? '#f0a020'
										: '#d03050'
							}
						>
							{realNameStatus.value?.icon ? <realNameStatus.value.icon /> : null}
						</NIcon>
						<NText class="text-xl font-bold">实名状态-{realNameStatus.value?.text}</NText>
					</NFlex>
					{domainInfo.value?.real_name_status === 1 && (
						<NText class="text-gray-500 mt-2 block">认证时间：{formatDate(domainInfo.value?.updated_at || 0)}</NText>
					)}
				</div>

				{/* 警告提示 */}
				{showAlert.value && (
					<NAlert type="warning" showIcon onClose={() => (showAlert.value = false)} class="mb-6">
						<div>请确保实名认证信息完整且准确，否则可能影响域名归属及使用</div>
						<div>实名认证完成后至少72小时才可进行网站备案，详情请咨询相关备案平台。</div>
					</NAlert>
				)}

				{/* 认证信息卡片 */}
				<NCard title="认证信息" header-style="font-size:16px;font-weight:500" class="mb-4">
					<NGrid cols="1 m:2" xGap="16" responsive="screen">
						<NGridItem>
							{renderInfoItem('域名', domainInfo.value?.full_domain)}
							{renderInfoItem('认证名称', realNameInfo.value?.owner_name)}
							{renderInfoItem('认证名称(英文)', realNameInfo.value?.owner_name_en)}
							{renderInfoItem(
								'证件类型',
								realNameInfo.value?.type === 1 ? '身份证' : realNameInfo.value?.type === 2 ? '营业执照' : '',
							)}
							{renderInfoItem('证件号码', realNameInfo.value?.id_number)}
						</NGridItem>
						<NGridItem>
							{renderInfoItem('域名到期时间', formatDate(domainInfo.value?.expire_time))}
							{renderInfoItem('联系邮箱', realNameInfo.value?.email)}
							{renderInfoItem('联系地址', realNameInfo.value?.address)}
							{renderInfoItem('联系地址(英文)', realNameInfo.value?.address_en)}
							{renderInfoItem('联系人', realNameInfo.value?.contact_person)}
						</NGridItem>
					</NGrid>
					<NDivider />
					<div class="flex items-center">
						<NButton
							type="primary"
							loading={isRealNameUpdating.value}
							disabled={isRealNameUpdating.value}
							onClick={openTemplateChangeModal}
						>
							更换实名模板
						</NButton>

						{isRealNameUpdating.value && (
							<>
								<div class="text-[#f0a020] text-sm ml-4">处理时间约为1-30分钟，请耐心等待</div>
								<NButton
									text
									size="small"
									class="ml-3"
									loading={loading.value}
									onClick={refreshDomainInfo}
									v-slots={{
										icon: () => (
											<NIcon size={16}>
												<RefreshCw />
											</NIcon>
										),
									}}
								>
									刷新状态
								</NButton>
							</>
						)}
					</div>
				</NCard>

				{/* 认证状态说明 */}
				<div class="mb-4">
					<NText class="text-gray-500">{realNameStatus.value?.description}</NText>
				</div>
			</div>
		)
	},
})
