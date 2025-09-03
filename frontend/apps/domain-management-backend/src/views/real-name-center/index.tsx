/**
 * 实名认证中心（独立状态页）
 * 仅依赖单一状态查询接口，点击“立即实名认证”时通过 onStartRealName 回调交给外部实现
 */

import { defineComponent, onMounted, ref } from 'vue'
import { NAlert, NButton, NCard, NFlex, NGrid, NGridItem, NTag, NText } from 'naive-ui'
import { useModal } from '@baota/naive-ui/hooks'
import { queryRealNameStatus, type RealNameStatusData } from '@/api/real-name-auth'
import { useRealNameState } from '@/views/real-name/useStore'
import DomainRegistrationForm from '@/views/real-name/components/DomainRegistrationForm/index'

export default defineComponent({
	name: 'RealNameCenter',
	props: {
		onStartRealName: {
			type: Function as unknown as () => () => void | Promise<void>,
			default: undefined,
		},
		notifyRealNameSubmitted: {
			type: Function as unknown as () => () => void,
			default: undefined,
		},
	},
	setup() {
		const status = ref(false)
		const loading = ref<boolean>(false)

		const realInfo = ref({
			name: '',
			id_card: '',
			phone: '',
		})

		// 身份证脱敏：前6后4保留，其余以*替换，长度不足8则仅保留后4位
		const maskIdCard = (id: string): string => {
			if (!id) return ''
			const len = id.length
			if (len <= 8) return id.replace(/.(?=.{4})/g, '*')
			const prefix = id.slice(0, 6)
			const suffix = id.slice(-4)
			return prefix + '*'.repeat(len - 10) + suffix
		}

		const {
			// 状态
			currentTemplate,
			// 方法
			convertToFormData,
			// 表单弹窗相关方法已通过useModal实现
		} = useRealNameState()
		const openRealNameDialog = ref()

		// 查询接口
		const fetchStatus = async () => {
			loading.value = true
			try {
				const { fetch, data } = queryRealNameStatus()
				await fetch()
				status.value = data.value?.status
				realInfo.value = data.value?.data as RealNameStatusData
			} finally {
				loading.value = false
			}
		}

		// 供外部在提交后调用
		const refreshAfterSubmit = async () => {
			await fetchStatus()
		}

		onMounted(fetchStatus)

		const handleStart = async () => {
			openRealNameDialog.value = useModal({
				title: '实名认证',
				area: '1000px',
				component: DomainRegistrationForm,
				componentProps: {
					mode: 'add',
					initialData: currentTemplate.value ? convertToFormData(currentTemplate.value) : undefined,
					refresh: refreshAfterSubmit,
				},
				footer: false,
			})
		}

		// 渲染顶部状态条
		const renderBanner = () => {
			if (status.value) {
				return (
					<NAlert type="success" showIcon title="已完成实名认证" class="mb-4">
						<NFlex align="center">
							<NText>您已完成实名认证，可以正常使用所有服务。</NText>
						</NFlex>
					</NAlert>
				)
			}
			return (
				<>
					<NAlert type="warning" showIcon title="未完成实名认证" class="mb-4">
						<NFlex align="center" justify="space-between">
							<NFlex align="center">
								<NText>您还未完成实名认证，请尽快完成以正常使用相关服务。</NText>
							</NFlex>
						</NFlex>
					</NAlert>
					<NButton type="primary" size="large" class="self-start" onClick={handleStart}>
						立即实名认证
					</NButton>
				</>
			)
		}

		const renderSuccessInfo = () => (
			<NCard title="认证信息" header-style="font-size:16px;font-weight:500" class="mb-4">
				<NGrid cols="1 m:2" xGap="16" responsive="screen">
					<NGridItem>
						<div class="mb-2 flex items-center  h-10">
							<div class="text-gray-500 font-bold w-25 mr-5 ml-1 flex-shrink-0">联系人</div>
							<div>{realInfo.value.name}</div>
						</div>
						<div class="mb-2 flex items-center  h-10">
							<div class="text-gray-500 font-bold w-25 mr-5 ml-1 flex-shrink-0">证件号码</div>
							<div>{maskIdCard(realInfo.value.id_card)}</div>
						</div>
						<div class="mb-2 flex items-center  h-10">
							<div class="text-gray-500 font-bold w-25 mr-5 ml-1 flex-shrink-0">审核状态</div>
							<NTag type="success">已通过</NTag>
						</div>
					</NGridItem>
				</NGrid>
			</NCard>
		)

		const renderTips = () => (
			<NCard class="mb-2" embedded>
				<div class="text-gray-700 mb-2">特别提醒</div>
				<div class="text-sm">
					1.
					根据《中华人民共和国网络安全法》第24条规定，网络运营者在为用户办理网络接入、域名注册等相关业务，必须进行实名认证，以保障合法用户的正当权益。
				</div>
				<div class="text-sm">2. 港澳台及海外用户认证需先提交工单，工单说明要开展什么业务、您的姓名、您所在国家。</div>
				<div class="text-sm">温馨提示：个人实名模板将会自动同步，企业用户模板无需处理。</div>
			</NCard>
		)

		return () => (
			<NCard title="实名认证" class="card-shadow" bordered={false}>
				<div class="flex flex-col gap-[16px]">
					{renderBanner()}
					{status.value ? renderSuccessInfo() : null}
					{renderTips()}
				</div>
			</NCard>
		)
	},
}) 