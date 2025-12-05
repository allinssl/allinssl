/**
 * 域名管理页面控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { useRouter } from 'vue-router'
import { defineComponent, type PropType } from 'vue'
import { NButton, NTooltip, NTag, NSpace, NCard, NFlex } from 'naive-ui'
import { formatDate } from '@baota/utils/date'
import { useDomainState } from './useStore'
import { useTable, useForm, useFormHooks } from '@baota/naive-ui/hooks'
import { queryDomainPrice, getWhoisInfo } from '@/api/domain'
import { useApp } from '@/components/layout/useStore'

import type { DomainListRequest, DomainItem } from '@/types/domain'
import { TableColumns } from 'naive-ui/es/data-table/src/interface'
import { refreshDomainStatus, deleteDomain } from '@api/domain'
import { renewOrder, queryPaymentStatus, buyByBalance } from '@/api/order'
import type { RenewRequest, RenewData } from '@/types/order'
import { useRechargeState } from '@/views/recharge/useStore'
import { useRechargeController } from '@/views/recharge/useController'
import { useModal, useMessage } from '@baota/naive-ui/hooks'
import RenewDialog from './components/RenewDialog'
// 导入域名详情页面的实名模板更换功能
import { useDomainDetailState } from '../domain-details/useStore'

// 定义标签类型
type TagType = 'default' | 'success' | 'warning' | 'error' | 'info'

let renewPollTimer: any
const openRenewModalRef = ref<{ close: () => void } | undefined>()

// WHOIS 查询加载状态管理
const whoisLoadingMap = ref<Record<string, boolean>>({})

/**
 * 域名管理页面控制器
 */
export function useController() {
	const router = useRouter()
	const route = useRoute()

	// 获取状态管理
	const { fetchDomainListData, filterFormData, statusOptions, suffixOptions, DOMAIN_STATUS_CONFIG, DOMAIN_STATUS_MAP } =
		useDomainState()
	const recharge = useRechargeState()
	const { loadAccountBalance } = useRechargeController()
	const { useFormInput, useFormSelect } = useFormHooks()
	// 获取移动端状态
	const { isMobile } = useApp()
	// 获取域名详情状态管理，用于实名模板更换功能
	const { fetchRealNameTemplateList, openTemplateChangeDialog, domainInfo, realNameInfo } = useDomainDetailState()

	const uMessage = useMessage()

	function computeNewExpire(years: number) {
		const state = useDomainState()
		const raw = Number(state.renewCurrentDomain.value?.expire_time || 0)
		if (!raw) return state.setRenewNewExpireDate('')
		const ms = raw < 1e12 ? raw * 1000 : raw
		const d = new Date(ms)
		d.setFullYear(d.getFullYear() + Number(years || 0))
		const y = d.getFullYear()
		const m = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		state.setRenewNewExpireDate(`${y}-${m}-${day}`)
	}

	/**
	 * 表单配置
	 */
	const formConfig = () => [
		useFormSelect(
			'',
			'status',
			statusOptions.value,
			{
				placeholder: '全部状态',
				class: 'w-28',
			},
			{ showLabel: false, showFeedback: false },
		),
		useFormSelect(
			'',
			'suffix',
			suffixOptions.value,
			{
				placeholder: '全部后缀',
				class: 'w-28',
			},
			{ showLabel: false, showFeedback: false },
		),
		useFormInput(
			'',
			'keyword',
			{
				placeholder: '请输入域名信息',
				clearable: true,
				class: 'w-64',
			},
			{ showLabel: false, showFeedback: false },
		),
		{
			type: 'custom' as const,
			render: () => (
				<NSpace>
					<NButton type="primary" onClick={() => formFetchSearch()}>
						搜索
					</NButton>
				</NSpace>
			),
		},
	]

	/**
	 * 表格列配置
	 */
	const createColumns = [
		{
			title: '域名',
			key: 'full_domain',
			width: 260,
			ellipsis: { tooltip: true },
			render: (row: DomainItem) => (
				<div class="flex items-center gap-2">
					<span class="i-mdi-earth text-emerald-500" />
					<div class="flex flex-col">
						<div class="font-medium">{row.full_domain}</div>
						{row.remark && <div class="text-xs text-gray-500">{row.remark}</div>}
					</div>
				</div>
			),
		},
		{
			title: '状态',
			key: 'status',
			width: 120,
			render: (row: DomainItem) => (
				<NSpace align="center" size={4}>
					<NTag type={getDomainStatusType(row.status)} bordered={false} size="small">
						{getDomainStatusText(row.status)}
					</NTag>

					{row.status === 0 && (
						<NTooltip>
							{{
								trigger: () => (
									<NButton
										quaternary
										size="tiny"
										type="primary"
										onClick={(e) => {
											e.stopPropagation()
											handleRefreshStatus(row.id)
										}}
									>
										刷新
									</NButton>
								),
								default: () => '刷新实名状态',
							}}
						</NTooltip>
					)}
				</NSpace>
			),
		},
		{
			title: '注册时间',
			key: 'register_time',
			width: 180,
			render: (row: DomainItem) => formatDate(row?.register_time || 0, 'yyyy-MM-dd'),
		},
		{
			title: '到期时间',
			key: 'expire_time',
			width: 180,
			render: (row: DomainItem) => formatDate(row?.expire_time || 0, 'yyyy-MM-dd'),
		},
		{
			title: '注册局状态',
			key: 'whois_status',
			width: 140,
			render: (row: DomainItem) => {
				const isLoading = whoisLoadingMap.value[row.full_domain] || false
				return (
					<div class="flex flex-wrap items-center gap-1">
						{row.whois_status
							? row.whois_status
									.split(' ')
									.filter(Boolean)
									.map((statusPart, index) => (
										<NTag
											key={`${row.full_domain}-${index}`}
											type={getWhoisStatusType(statusPart)}
											bordered={false}
											size="small"
										>
											{statusPart}
										</NTag>
									))
							: ''}
						<NButton
							quaternary
							size="tiny"
							type="primary"
							loading={isLoading}
							disabled={isLoading}
							onClick={(e) => {
								e.stopPropagation()
								handleQueryWhois(row.full_domain)
							}}
						>
							{isLoading ? '查询中...' : row.whois_status ? '刷新' : '查询状态'}
						</NButton>
					</div>
				)
			},
		},
		{
			title: '操作',
			key: 'actions',
			width: 200,
			align: 'right',
			fixed: 'right',
			render: (row: DomainItem) => {
				// 当real_name_status为0时，仅显示立即实名按钮
				if (row.real_name_status === 0) {
					return (
						<NSpace justify="end">
							<NButton size="small" type="error" ghost onClick={() => openTemplateChangeModal(row.id)}>
								立即实名
							</NButton>
						</NSpace>
					)
				} else if (row.real_name_status === 4) {
					// 更换中
					return (
						<NSpace justify="end">
							<NButton size="small" type="warning" ghost disabled>
								更换中
							</NButton>
						</NSpace>
					)
				}

				// 其他情况保持原有逻辑
				return (
					<NSpace justify="end">
						<NButton size="small" type="primary" ghost onClick={() => handleManage(row)}>
							管理
						</NButton>
						<NButton size="small" ghost onClick={() => handleRenew(row)}>
							续费
						</NButton>
						<NButton size="small" ghost onClick={() => handleDns(row)}>
							解析
						</NButton>
						{row.status === 5 && (
							<NButton size="small" type="error" ghost onClick={() => handleDeleteDomain(row.id)}>
								删除
							</NButton>
						)}
					</NSpace>
				)
			},
		},
	] as TableColumns<DomainItem>

	/**
	 * 移动端卡片组件
	 */
	const DomainCardList = defineComponent({
		name: 'DomainCardList',
		props: {
			data: {
				type: Array as PropType<DomainItem[]>,
				default: () => [],
			},
			loading: {
				type: Boolean,
				default: false,
			},
		},
		setup(props) {
			return () => (
				<NFlex vertical size="medium">
					{props.data.map((item: DomainItem) => (
						<NCard key={item.id} class="card-shadow" bordered={false}>
							<NFlex vertical size="small">
								{/* 域名信息 */}
								<NFlex align="center" justify="space-between">
									<NFlex align="center" size="small">
										<div>
											<div class="font-medium text-base">{item.full_domain}</div>
										</div>
									</NFlex>
									<NFlex align="center" size="small">
										<NTag type={getDomainStatusType(item.status)} bordered={false} size="small">
											{getDomainStatusText(item.status)}
										</NTag>
										{item.status === 0 && (
											<NTooltip>
												{{
													trigger: () => (
														<NButton
															quaternary
															size="tiny"
															type="primary"
															onClick={(e) => {
																e.stopPropagation()
																handleRefreshStatus(item.id)
															}}
														>
															刷新
														</NButton>
													),
													default: () => '刷新实名状态',
												}}
											</NTooltip>
										)}
									</NFlex>
								</NFlex>

								{/* 时间信息 */}
								<NFlex justify="space-between" class="text-sm text-gray-600">
									<div>
										<span class="text-gray-500">注册：</span>
										{formatDate(item?.register_time || 0, 'yyyy-MM-dd')}
									</div>
									<div>
										<span class="text-gray-500">到期：</span>
										{formatDate(item?.expire_time || 0, 'yyyy-MM-dd')}
									</div>
								</NFlex>

								{/* 操作按钮 */}
								<NFlex justify="end" size="small">
									<NButton size="small" type="primary" ghost onClick={() => handleManage(item)}>
										管理
									</NButton>
									<NButton size="small" ghost onClick={() => handleRenew(item)}>
										续费
									</NButton>
									<NButton size="small" ghost onClick={() => handleDns(item)}>
										解析
									</NButton>
									{item.status === 5 && (
										<NButton size="small" type="error" ghost onClick={() => handleDeleteDomain(item.id)}>
											删除
										</NButton>
									)}
								</NFlex>
							</NFlex>
						</NCard>
					))}
				</NFlex>
			)
		},
	})

	// 表格实例
	const {
		TableComponent: DomainTable,
		PageComponent: DomainTablePage,
		loading,
		param,
		fetch: fetchDomain,
		data: tableData,
	} = useTable<DomainItem, DomainListRequest>({
		config: createColumns,
		request: fetchDomainListData,
		defaultValue: filterFormData,
		alias: {
			page: 'p',
			pageSize: 'rows',
		},
		watchValue: ['p', 'rows', 'status', 'suffix'],
	})

	// 表单实例
	const { component: FilterForm, fetch: formFetchSearch } = useForm<DomainListRequest>({
		config: formConfig(),
		defaultValue: filterFormData,
		request: handleFormSearch,
	})

	// -------------------- 映射工具方法 --------------------

	/**
	 * 获取域名状态文本
	 */
	const getDomainStatusText = (status: number | undefined): string => {
		// 确保 status 是有效的数字，并转换为字符串类型的键
		const statusKey = String(status ?? 0) as unknown as keyof typeof DOMAIN_STATUS_MAP
		const key = DOMAIN_STATUS_MAP[statusKey] || 'pending'
		return DOMAIN_STATUS_CONFIG[key]?.text || '未知'
	}

	/**
	 * 获取域名状态类型
	 */
	const getDomainStatusType = (status: number | undefined): TagType => {
		// 确保 status 是有效的数字，并转换为字符串类型的键
		const statusKey = String(status ?? 0) as unknown as keyof typeof DOMAIN_STATUS_MAP
		const key = DOMAIN_STATUS_MAP[statusKey] || 'pending'
		return DOMAIN_STATUS_CONFIG[key]?.type || 'default'
	}

	/**
	 * 获取whois状态类型
	 */
	const getWhoisStatusType = (whoisStatus: string | undefined): TagType => {
		if (!whoisStatus) return 'error'

		if (whoisStatus === '正常') {
			return 'success'
		} else if (whoisStatus === '转移中') {
			return 'warning'
		} else {
			return 'error'
		}
	}

	// -------------------- 事件处理 --------------------

	/**
	 * 表单搜索触发
	 */
	async function handleFormSearch(formData: DomainListRequest) {
		await fetchDomain()
	}

	/**
	 * 重置查询条件
	 */
	function formDataReset() {
		filterFormData.value = { keyword: '', status: -1, suffix: '' }
		param.value.keyword = ''
		param.value.status = ''
		param.value.suffix = ''
		param.value.p = 1
	}

	/**
	 * 点击管理
	 */
	function handleManage(row: DomainItem) {
		router.push(`/domain/detail/${row.id}`)
	}

	/**
	 * 点击解析
	 */
	function handleDns(row: DomainItem) {
		// router.push(`/domain/detail/${row.id}?tabs=analysis`)
		router.push(`/domain-resolve/detail/${row.id}?domain_name=${row.full_domain}`)
	}

	/**
	 * 打开实名模板更换弹窗
	 */
	const openTemplateChangeModal = async (domainId: string | number) => {
		// 先加载实名模板列表
		await fetchRealNameTemplateList()

		// 遵循 real-name 模式，将 useModal 结果赋值给 store 中的 ref
		openTemplateChangeDialog.value = useModal({
			title: '更换实名模板',
			area: '650px',
			component: () => import('../domain-details/components/RealNameTemplateChangeDialog'),
			componentProps: {
				domainId: Number(domainId),
				domainInfo: domainInfo.value,
				isNotReal: true,
				currentTemplate: realNameInfo.value,
				refresh: async () => {
					// 刷新域名列表
					await fetchDomainListData()
				},
			},
			footer: false,
		})
	}

	// 续费入口
	async function ensureRenewBalance() {
		try {
			await loadAccountBalance()
			useDomainState().setRenewBalance(Number(recharge.overview.value?.balance || 0))
		} catch {
			useDomainState().setRenewBalance(0)
		}
	}
	function openRenewModal(row: DomainItem) {
		const state = useDomainState()
		state.resetRenew()
		state.setRenewCurrentDomain(row)
		void ensureRenewBalance()
		openRenewModalRef.value = useModal({
			title: '域名续费',
			area: '520px',
			component: RenewDialog,
			componentProps: { YEAR_OPTIONS: [1, 2, 3, 5] },
			footer: false,
			onClose: () => {
				closeRenewModal()
			},
		})
		// Step1: 打开即查价，不下单
		void queryRenewPrice(state.renewSelectedYear.value)
		computeNewExpire(state.renewSelectedYear.value)
	}

	async function doRenew(domain: string, year: number) {
		const state = useDomainState()
		state.setRenewLoading(true)
		try {
			const payload: RenewRequest = { domain_list: [{ domain, year, domain_service: 0 }] }
			const { fetch, data } = renewOrder(payload)
			await fetch()
			if (!data.value?.status) {
				uMessage.error(data.value?.msg || '续费失败')
				return false
			}
			state.setRenewOrderInfo((data.value.data as RenewData) || null)
			state.setRenewStep(2)
			startRenewPolling(data.value.data?.order_no)
		} finally {
			state.setRenewLoading(false)
		}
	}

	async function queryRenewPrice(year?: number) {
		const state = useDomainState()
		if (!state.renewCurrentDomain.value) return
		state.setRenewLoading(true)
		try {
			const { fetch, data } = queryDomainPrice({
				domain: state.renewCurrentDomain.value.full_domain,
				year: year ?? state.renewSelectedYear.value,
				type: 'renew',
			})
			await fetch()
			const res = data.value?.data
			const hit = res?.results[0]
			state.setRenewPriceInfo(hit || null)
		} catch {
			state.setRenewPriceInfo(null)
		} finally {
			state.setRenewLoading(false)
		}
	}

	function startRenewPolling(orderNo: string) {
		clearTimeout(renewPollTimer)
		if (!orderNo) return
		let count = 0
		const maxCount = 60
		renewPollTimer = setInterval(async () => {
			count++
			try {
				const { fetch, data: pollData } = queryPaymentStatus({ order_no: orderNo })
				await fetch()
				const paid = Number(pollData.value?.data?.status ?? 0) === 1
				if (paid) {
					clearInterval(renewPollTimer)
					renewPollTimer = null
					closeRenewModal()
					uMessage.success('续费成功')
					return
				}
				if (count >= maxCount) {
					clearInterval(renewPollTimer)
					renewPollTimer = null
				}
			} catch {
				if (count >= maxCount) {
					clearInterval(renewPollTimer)
					renewPollTimer = null
				}
			}
		}, 3000)
	}

	function stopRenewPolling() {
		if (renewPollTimer) {
			clearInterval(renewPollTimer)
			renewPollTimer = null
		}
	}

	function closeRenewModal(isCancelOrder: boolean = false) {
		if (renewPollTimer) {
			clearInterval(renewPollTimer)
			renewPollTimer = null
		}
		openRenewModalRef.value?.close?.()
		fetchDomain()
	}

	async function changeRenewYear(year: number) {
		const state = useDomainState()
		state.setRenewSelectedYear(year)
		await queryRenewPrice(year)
		computeNewExpire(year)
	}

	function switchRenewChannel(c: 'wechat' | 'alipay' | 'balance') {
		const state = useDomainState()
		state.setRenewPayChannel(c)
		const orderNo = state.renewOrderInfo.value?.order_no || ''
		if (c === 'balance') {
			stopRenewPolling()
			return
		}
		// 扫码支付：如有订单且未在轮询中，则启动轮询
		if (orderNo && !renewPollTimer) {
			startRenewPolling(orderNo)
		}
	}

	async function payRenewByBalance() {
		const state = useDomainState()
		const orderNo = state.renewOrderInfo.value?.order_no || ''
		if (!orderNo) {
			uMessage.error('未找到续费订单')
			return
		}
		const need = Number(state.renewOrderInfo.value?.total_price || 0)
		const has = Number(state.renewBalanceAvailable.value || 0)
		if (has < need) {
			uMessage.warning('余额不足，请先充值')
			return
		}
		try {
			const { fetch, data } = buyByBalance({ order_no: orderNo })
			await fetch()
			if (!data.value?.status) {
				uMessage.error(data.value?.msg || '支付失败')
				return
			}
			stopRenewPolling()
			uMessage.success('续费成功')
			closeRenewModal()
		} catch (e) {
			uMessage.error('支付异常')
		}
	}

	function handleRenew(row: DomainItem) {
		openRenewModal(row)
	}

	/**
	 * 查询域名 whois 信息
	 * @param domainName 完整域名
	 */
	async function handleQueryWhois(domainName: string) {
		// 防止重复点击
		if (whoisLoadingMap.value[domainName]) {
			return
		}

		try {
			// 设置加载状态
			whoisLoadingMap.value[domainName] = true

			// 调用 whois 查询 API
			const { fetch: whoisFetch, message } = getWhoisInfo({
				full_domain: domainName,
			})
			message.value = true
			await whoisFetch()
			// 查询成功后刷新域名列表
			await fetchDomain()
		} catch (error) {
			console.error('查询 whois 信息失败:', error)
		} finally {
			// 清除加载状态
			whoisLoadingMap.value[domainName] = false
		}
	}

	/**
	 * 刷新域名注册状态
	 * @param domainId 域名id
	 */
	async function handleRefreshStatus(domainId: number) {
		try {
			// 调用刷新域名状态 API
			const { fetch: refreshFetch, message } = refreshDomainStatus({
				domain_id: domainId,
			})
			message.value = true
			await refreshFetch()
			await fetchDomain()
		} catch (error) {
			console.error('刷新域名状态失败:', error)
		}
	}

	/**
	 * 删除域名
	 * @param domainId 域名id
	 */
	async function handleDeleteDomain(domainId: number) {
		try {
			// 调用删除域名 API
			const { fetch: deleteFetch, message } = deleteDomain({
				id: domainId,
			})
			message.value = true
			await deleteFetch()
			await fetchDomain()
		} catch (error) {
			console.error('删除域名失败:', error)
		}
	}

	// 组件挂载时获取路由参数
	onMounted(async () => {
		// 获取路由参数并赋值
		if (route.query.status) param.value.status = Number(route.query.status) || -1
		await fetchDomain()
		router.replace({ query: {} })
	})

	// 组件卸载时重置表单数据
	onUnmounted(() => {
		formDataReset()
	})

	return {
		// 状态
		loading,
		isMobile,

		// 表格
		DomainTable,
		DomainTablePage,
		tableData,

		// 移动端卡片
		DomainCardList,

		// 表单
		FilterForm,
		formFetchSearch,
		formDataReset,
		handleRenew,
		openRenewModal,
		queryRenewPrice,
		changeRenewYear,
		switchRenewChannel,
		payRenewByBalance,
		doRenew,
		closeRenewModal,
		handleDeleteDomain,
		handleQueryWhois,
		openTemplateChangeModal,
	}
}
