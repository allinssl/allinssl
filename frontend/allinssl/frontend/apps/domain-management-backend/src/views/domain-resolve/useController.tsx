/**
 * 域名解析页面控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { ref, reactive, onMounted, watch, computed, defineComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
	NButton,
	NTag,
	NSpace,
	NCard,
	NFlex,
	NAlert,
	NText,
	NIcon,
	NForm,
	NFormItem,
	NInput,
	useDialog,
} from 'naive-ui'
import { CheckmarkOutline } from '@vicons/ionicons5'
import { formatDate } from '@baota/utils/date'
import { useDomainResolveState } from './useStore'
import {
	useTable,
	useForm,
	useFormHooks,
	useModal,
	useModalHooks,
	useMessage,
	useLoadingMask,
} from '@baota/naive-ui/hooks'
import { useApp } from '@/components/layout/useStore'
import { addExternalDomain, removeDomain } from '@/api/resolve'
import { useError } from '@baota/hooks/error'
// 导入域名详情页面的实名模板更换功能
import { useDomainDetailState } from '../domain-details/useStore'

const message = useMessage()
const { handleError } = useError()

import type { ResolveListRequest, ResolveItem, DomainAddForm } from './types.d'
import { TableColumns } from 'naive-ui/es/data-table/src/interface'
import type { FormInst, FormRules } from 'naive-ui'

// 定义标签类型
type TagType = 'default' | 'success' | 'warning' | 'error' | 'info'

/**
 * DNS设置提示模态框组件
 */
const createDnsSetupModal = (fetchResolve: () => Promise<void>) =>
	defineComponent({
		name: 'DnsSetupModal',
		props: {
			domain: {
				type: String,
				required: true,
			},
			domainId: {
				type: Number,
				required: true,
			},
			domainType: {
				type: Number,
				required: true,
			},
			lastCheckTime: {
				type: String,
				default: null,
			},
		},
		setup(props) {
			const { close } = useModalHooks()
			const closeModal = close()
			const message = useMessage()
			const { checkDomainStatusApi } = useDomainResolveState()
			const redetectLoading = ref(false)

			// 计算是否在半小时内检测过
			const isRedetectDisabled = computed(() => {
				if (!props.lastCheckTime) {
					return false // 如果没有检测时间，说明没有检测过，可以检测
				}

				try {
					// 解析时间字符串，支持多种格式
					let lastCheckTime: number

					// 尝试直接解析
					const directParse = new Date(props.lastCheckTime).getTime()
					if (!isNaN(directParse)) {
						lastCheckTime = directParse
					} else {
						// 如果直接解析失败，尝试手动解析 "2025-09-12 16:49:37" 格式
						const timeStr = props.lastCheckTime.replace(/-/g, '/') // 将 - 替换为 / 以提高兼容性
						lastCheckTime = new Date(timeStr).getTime()
					}

					const currentTime = new Date().getTime()
					const halfHour = 30 * 60 * 1000 // 30分钟的毫秒数

					// 检查时间是否有效
					if (isNaN(lastCheckTime)) {
						console.warn('Invalid lastCheckTime format:', props.lastCheckTime)
						return false
					}

					const timeDiff = currentTime - lastCheckTime
					console.log('Time calculation:', {
						lastCheckTime: props.lastCheckTime,
						lastCheckTimeMs: lastCheckTime,
						lastCheckTimeDate: new Date(lastCheckTime).toLocaleString(),
						currentTimeMs: currentTime,
						currentTimeDate: new Date(currentTime).toLocaleString(),
						timeDiffMs: timeDiff,
						timeDiffMinutes: Math.round(timeDiff / (60 * 1000)),
						halfHourMs: halfHour,
						halfHourMinutes: 30,
						isDisabled: timeDiff < halfHour,
					})

					return timeDiff < halfHour
				} catch (error) {
					console.error('Error parsing lastCheckTime:', error)
					return false
				}
			})

			// 计算剩余时间（分钟）
			const remainingMinutes = computed(() => {
				if (!props.lastCheckTime || !isRedetectDisabled.value) {
					return 0
				}

				try {
					const lastCheckTime = new Date(props.lastCheckTime).getTime()
					const currentTime = new Date().getTime()
					const halfHour = 30 * 60 * 1000
					const timeDiff = currentTime - lastCheckTime
					const remaining = halfHour - timeDiff

					const minutes = Math.ceil(remaining / (60 * 1000)) // 转换为分钟并向上取整
					console.log('Remaining time calculation:', {
						remainingMs: remaining,
						remainingMinutes: minutes,
					})

					return Math.max(0, minutes) // 确保不返回负数
				} catch (error) {
					console.error('Error calculating remaining time:', error)
					return 0
				}
			})
			const handleRedetect = async () => {
				try {
					redetectLoading.value = true
					const result = await checkDomainStatusApi(props.domainId, props.domainType)
					if (!result?.status) {
						return message.error(result?.msg || '检测失败，请稍后重试')
					}
					await fetchResolve()
					closeModal()
				} catch (error) {
					message.error(error as string)
				} finally {
					redetectLoading.value = false
				}
			}

			return () => (
				<div class="max-w-2xl">
					<div class="space-y-6">
						<NAlert type="warning" showIcon>
							<div class="flex items-center gap-2">
								<span class="font-medium">域名待生效</span>
							</div>
							<div class="mt-2 text-sm">
								域名 <span class="font-bold">{props.domain}</span> 当前状态为待生效，请按以下步骤设置DNS服务器：
							</div>
						</NAlert>

						<NAlert type="info" showIcon>
							<div class="font-medium mb-3">DNS服务器设置指引</div>
							<div class="text-sm space-y-2">
								<div class="flex items-start gap-2">
									<span class="text-blue-600 font-medium min-w-[20px]">1.</span>
									<span>登录您的域名注册商管理面板</span>
								</div>
								<div class="flex items-start gap-2">
									<span class="text-blue-600 font-medium min-w-[20px]">2.</span>
									<span>找到DNS设置或域名服务器设置</span>
								</div>
								<div class="flex items-start gap-2">
									<span class="text-blue-600 font-medium min-w-[20px]">3.</span>
									<div class="flex-1">
										<div class="mb-2">将域名服务器修改为以下地址：</div>
										<div class="bg-gray-50 p-3 rounded-md font-mono text-sm space-y-1">
											<div class="text-gray-600">ns1.baotadns.com</div>
											<div class="text-gray-600">ns2.baotadns.com</div>
										</div>
									</div>
								</div>
								<div class="flex items-start gap-2">
									<span class="text-blue-600 font-medium min-w-[20px]">4.</span>
									<span>保存设置并等待生效（通常需要24-48小时）</span>
								</div>
								<div class="flex items-start gap-2">
									<span class="text-blue-600 font-medium min-w-[20px]">5.</span>
									<span>点击检测按钮验证设置是否生效</span>
								</div>
							</div>
						</NAlert>

						<NAlert type="success" showIcon>
							<div class="font-medium mb-2">设置完成后</div>
							<div class="flex items-start gap-2 text-sm">
								<NIcon class="text-green-500 mt-0.5" size="16">
									<CheckmarkOutline />
								</NIcon>
								<span>DNS服务器设置完成后，您可以点击下方的"重新检测"按钮来检测域名状态是否已更新。</span>
							</div>
						</NAlert>
					</div>

					<div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
						<NButton onClick={closeModal} disabled={redetectLoading.value}>
							关闭
						</NButton>
						<NButton
							type="primary"
							loading={redetectLoading.value}
							disabled={redetectLoading.value || isRedetectDisabled.value}
							onClick={handleRedetect}
						>
							{redetectLoading.value
								? '检测中...'
								: isRedetectDisabled.value
									? `重新检测（${remainingMinutes.value}分钟后可用）`
									: '重新检测'}
						</NButton>
					</div>
				</div>
			)
		},
	})

/**
 * 域名解析页面控制器
 */
export function useController() {
	const router = useRouter()
	const route = useRoute()

	// 获取从URL传递的域名名称
	const domainName = ref<string>((route.query.domain_name as string) || '')

	const {
		fetchResolveListData,
		filterFormData,
		statusOptions,
		NS_STATUS_CONFIG,
		NS_STATUS_MAP,
		DOMAIN_TYPE_CONFIG,
		DOMAIN_TYPE_MAP,
		setSelectedDomainInfo,
	} = useDomainResolveState()

	// 获取域名详情状态管理，用于实名模板更换功能
	const { fetchRealNameTemplateList, openTemplateChangeDialog, domainInfo, realNameInfo } = useDomainDetailState()

	const { useFormInput, useFormSelect } = useFormHooks()
	const dialog = useDialog()
	// 获取移动端状态
	const { isMobile } = useApp()

	// -------------------- 事件处理方法 --------------------

	/**
	 * 打开实名模板更换弹窗
	 * @param row 域名行数据
	 */
	async function openTemplateChangeModal(domainId: string | number) {
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
					// 刷新解析列表
					await fetchResolveListData()
				},
			},
			footer: false,
		})
	}

	/**
	 * 添加域名表单配置
	 */
	const addDomainFormConfig = [
		useFormInput(
			'域名',
			'domain',
			{
				placeholder: '请输入域名，如：example.com',
				clearable: true,
			},
			{
				required: true,
				showFeedback: true,
				labelWidth: '80px',
				rule: {
					required: true,
					message: '请输入域名',
					trigger: ['blur', 'input'],
				},
			},
		),
		useFormInput(
			'备注',
			'remark',
			{
				placeholder: '请输入备注信息（可选）',
				clearable: true,
			},
			{
				required: false,
				showFeedback: false,
				labelWidth: '80px',
			},
		),
	]

	/**
	 * 添加域名
	 */

	async function handleAddDomainSubmit(data: DomainAddForm): Promise<void> {
		const { open: openLoad, close: closeLoad } = useLoadingMask({ text: '正在添加域名，请稍后...' })
		openLoad()
		try {
			const {
				fetch,
				message,
				data: addDomainData,
			} = addExternalDomain({
				full_domain: data.domain.trim(),
				remark: data.remark?.trim(),
			})
			message.value = true
			await fetch()
			if (!addDomainData.value?.status) {
				useMessage().error(addDomainData.value?.msg || '添加域名失败')
				return
			}
			await fetchResolve()
			closeAddDomainModal()
		} catch (error) {
			handleError(error)
		} finally {
			closeLoad()
		}
	}

	/**
	 * 处理解析按钮点击
	 */
	const handleResolve = (row: ResolveItem) => {
		setSelectedDomainInfo({
			id: row.local_id,
			name: row.full_domain,
			domain_type: row.domain_type,
		})
		router.push({
			path: `/domain-resolve/detail/${row.local_id}`,
			query: {
				domain_name: row.full_domain,
				domain_type: row.domain_type,
			},
		})
	}

	/**
	 * 处理删除按钮点击
	 */
	const handleDelete = (row: ResolveItem) => {
		dialog.warning({
			title: '确认删除',
			content: `确定要删除域名"${row.full_domain}"吗？删除后无法恢复。`,
			positiveText: '删除',
			negativeText: '取消',
			onPositiveClick: async () => {
				const { open: openLoad, close: closeLoad } = useLoadingMask({ text: '正在删除域名，请稍后...' })
				openLoad()
				try {
					const { fetch, message } = removeDomain({
						domain_id: row.local_id,
					})
					message.value = true
					await fetch()
					await fetchResolve()
				} catch (error) {
					handleError(error)
				} finally {
					closeLoad()
				}
			},
		})
	}

	/**
	 * 处理状态点击（仅未生效状态）
	 */
	const handleStatusClick = (row: ResolveItem) => {
		if (row.ns_status === 2) {
			// 未生效状态
			handleShowDnsModal(row.full_domain?.trim(), row.local_id, row.domain_type, row.last_check_time || undefined)
		}
	}

	/**
	 * 显示DNS设置模态框
	 */
	const handleShowDnsModal = (domain: string, domainId: number, domainType: number, lastCheckTime?: string) => {
		const DnsSetupModalComponent = createDnsSetupModal(fetchResolve)
		useModal({
			title: 'DNS设置',
			area: '600px',
			component: DnsSetupModalComponent,
			componentProps: {
				domain,
				domainId,
				domainType,
				lastCheckTime,
			},
			footer: false,
		})
	}

	/**
	 * 添加域名模态框
	 */
	const handleShowAddDomainModal = () => {
		addDomainModalRef.value = useModal({
			title: '添加域名',
			area: '500px',
			component: AddDomainFormWrapper,
			footer: false,
		})
	}

	/**
	 * 表单配置
	 */
	const formConfig = () => [
		// useFormSelect(
		// 	'',
		// 	'status',
		// 	statusOptions.value,
		// 	{
		// 		placeholder: '全部状态',
		// 		class: 'w-28',
		// 	},
		// 	{ showLabel: false, showFeedback: false },
		// ),
		useFormInput(
			'',
			'keyword',
			{
				placeholder: '请输入域名',
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
			width: 200,
			ellipsis: { tooltip: true },
			render: (row: ResolveItem) => (
				<div class="flex items-center gap-2">
					<span class="i-mdi-earth text-emerald-500" />
					<div class="font-medium">{row.full_domain?.trim()}</div>
				</div>
			),
		},
		{
			title: 'NS状态',
			key: 'ns_status',
			width: 100,
			render: (row: ResolveItem) => {
				const isPending = row.ns_status === 2
				return isPending ? (
					<NButton
						text
						type="warning"
						size="small"
						onClick={() =>
							handleShowDnsModal(
								row.full_domain?.trim(),
								row.local_id,
								row.domain_type,
								row.last_check_time || undefined,
							)
						}
						class="!p-0 !h-auto"
					>
						<NTag type="warning" bordered={false} size="small" class="cursor-pointer">
							{getNsStatusText(row.ns_status)}
						</NTag>
					</NButton>
				) : (
					<NTag type={getNsStatusType(row.ns_status)} bordered={false} size="small">
						{getNsStatusText(row.ns_status)}
					</NTag>
				)
			},
		},
		{
			title: '购买来源',
			key: 'domain_type',
			width: 120,
			render: (row: ResolveItem) => {
				const typeKey = DOMAIN_TYPE_MAP[row.domain_type] || 'platform'
				const config = DOMAIN_TYPE_CONFIG[typeKey]
				return <span class="text-gray-700">{config.text}</span>
			},
		},
		{
			title: '解析记录数',
			key: 'record_count',
			width: 120,
			align: 'center',
			render: (row: ResolveItem) => <span class="font-medium">{row.record_count}</span>,
		},
		{
			title: '备注',
			key: 'remark',
			width: 150,
			ellipsis: { tooltip: true },
			render: (row: ResolveItem) => <span class="text-gray-600">{row.remark || '-'}</span>,
		},
		{
			title: '创建时间',
			key: 'created_at',
			width: 150,
			render: (row: ResolveItem) => {
				const date = new Date(row.created_at)
				return formatDate(date.getTime(), 'yyyy-MM-dd HH:mm')
			},
		},
		{
			title: '操作',
			key: 'actions',
			width: 150,
			align: 'right',
			fixed: 'right',
			render: (row: ResolveItem) => {
				// 完全按照域名管理页面的立即实名逻辑实现
				if (row.real_name_status === 0) {
					// 实名状态为未实名时，显示立即实名按钮
					return (
						<NSpace justify="end">
							<NButton size="small" type="error" ghost onClick={() => openTemplateChangeModal(row.local_id)}>
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

				// NS状态已设置时，显示常规操作按钮
				return (
					<NSpace justify="end">
						<NButton size="small" type="primary" ghost onClick={() => handleResolve(row)}>
							解析
						</NButton>
						{row.domain_type === 2 && (
							<NButton size="small" type="error" ghost onClick={() => handleDelete(row)}>
								删除
							</NButton>
						)}
					</NSpace>
				)
			},
		},
	] as TableColumns<ResolveItem>

	/**
	 * 移动端卡片组件
	 */
	const ResolveCardList = defineComponent({
		name: 'ResolveCardList',
		props: {
			data: {
				type: Array as PropType<ResolveItem[]>,
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
					{props.data.map((item: ResolveItem) => (
						<NCard key={item.local_id} class="card-shadow" bordered={false}>
							<NFlex vertical size="small">
								<NFlex align="center" justify="space-between">
									<NFlex align="center" size="small">
										<div>
											<div class="font-medium text-base">{item.full_domain?.trim()}</div>
											<div class="text-sm text-gray-500">{item.remark || '-'}</div>
										</div>
									</NFlex>
									<NFlex align="center" size="small">
										{item.ns_status === 2 ? (
											<NButton
												text
												type="warning"
												size="small"
												onClick={() =>
													handleShowDnsModal(
														item.full_domain?.trim(),
														item.local_id,
														item.domain_type,
														item.last_check_time || undefined,
													)
												}
												class="!p-0 !h-auto"
											>
												<NTag type="warning" bordered={false} size="small" class="cursor-pointer">
													{getNsStatusText(item.ns_status)}
												</NTag>
											</NButton>
										) : (
											<NTag type={getNsStatusType(item.ns_status)} bordered={false} size="small">
												{getNsStatusText(item.ns_status)}
											</NTag>
										)}
									</NFlex>
								</NFlex>

								<NFlex justify="space-between" class="text-sm">
									<span class="text-gray-500">解析记录数：</span>
									<span class="font-medium text-blue-600">{item.record_count}</span>
								</NFlex>

								<NFlex justify="space-between" class="text-sm text-gray-600">
									<div>
										<span class="text-gray-500">创建：</span>
										{formatDate(new Date(item.created_at).getTime(), 'yyyy-MM-dd')}
									</div>
									<div>
										<span class="text-gray-500">类型：</span>
										{DOMAIN_TYPE_CONFIG[DOMAIN_TYPE_MAP[item.domain_type] || 'platform']?.text}
									</div>
								</NFlex>

								<NFlex justify="end" size="small">
									<NButton size="small" type="primary" ghost onClick={() => handleResolve(item)}>
										解析
									</NButton>
									{item.domain_type === 2 && (
										<NButton size="small" type="error" ghost onClick={() => handleDelete(item)}>
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
		TableComponent: ResolveTable,
		PageComponent: ResolveTablePage,
		loading,
		param,
		fetch: fetchResolve,
		data: tableData,
	} = useTable<ResolveItem, ResolveListRequest>({
		config: createColumns,
		request: fetchResolveListData,
		defaultValue: filterFormData,
		alias: {
			page: 'p',
			pageSize: 'rows',
		},
		watchValue: ['p', 'rows', 'status'],
	})

	const { component: FilterForm } = useForm<ResolveListRequest>({
		config: formConfig(),
		defaultValue: filterFormData,
	})

	const { component: AddDomainForm, fetch: submitAddDomain } = useForm<DomainAddForm>({
		config: addDomainFormConfig,
		defaultValue: { domain: '', remark: '' },
		request: handleAddDomainSubmit,
	})

	const addDomainModalRef = ref<any>(null)

	/**
	 * 关闭添加域名模态框
	 */
	const closeAddDomainModal = () => {
		if (addDomainModalRef.value) {
			addDomainModalRef.value.close()
			addDomainModalRef.value = null
		}
	}

	/**
	 * 添加域名表单包装组件（包含DNS提示和提交按钮）
	 */
	const AddDomainFormWrapper = defineComponent({
		name: 'AddDomainFormWrapper',
		setup() {
			return () => (
				<div class="max-w-2xl">
					<AddDomainForm />

					<NAlert type="info" showIcon class="mt-4">
						<div class="font-medium mb-2">DNS服务器设置</div>
						<div class="text-sm mb-3">添加域名后，您需要将DNS服务器修改为：</div>

						<div class="bg-gray-50 p-3 rounded-md font-mono text-sm space-y-1">
							<div class="text-gray-600">ns1.baotadns.com</div>
							<div class="text-gray-600">ns2.baotadns.com</div>
						</div>

						<div class="mt-3 text-xs text-gray-500">
							请在您的域名注册商处将DNS服务器修改为上述地址，修改后生效时间通常为24-48小时。
						</div>
					</NAlert>

					<div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
						<NButton onClick={closeAddDomainModal}>取消</NButton>
						<NButton type="primary" onClick={() => submitAddDomain()}>
							确认添加
						</NButton>
					</div>
				</div>
			)
		},
	})

	const formFetchSearch = async () => {
		await fetchResolve()
	}

	// 监听路由从其他页面返回时刷新列表
	watch(
		() => route.path,
		(newPath, oldPath) => {
			// 当路由从详情页返回到列表页时，刷新数据
			if (newPath === '/domain-resolve' && oldPath?.includes('/domain-resolve/detail/')) {
				fetchResolve()
			}
		},
		{ immediate: false },
	)

	// -------------------- 映射工具方法 --------------------

	/**
	 * 获取NS状态文本
	 */
	const getNsStatusText = (status: number | undefined): string => {
		const statusKey = String(status ?? 0) as unknown as keyof typeof NS_STATUS_MAP
		const key = NS_STATUS_MAP[statusKey] || 'notSet'
		return NS_STATUS_CONFIG[key]?.text || '未知'
	}

	/**
	 * 获取NS状态类型
	 */
	const getNsStatusType = (status: number | undefined): TagType => {
		const statusKey = String(status ?? 0) as unknown as keyof typeof NS_STATUS_MAP
		const key = NS_STATUS_MAP[statusKey] || 'notSet'
		return NS_STATUS_CONFIG[key]?.type || 'default'
	}

	// -------------------- 事件处理 --------------------

	/**
	 * 重置查询条件
	 */
	function formDataReset() {
		filterFormData.value = { keyword: '', status: '' }
		param.value.keyword = ''
		param.value.status = ''
		param.value.p = 1
		fetchResolve()
	}

	return {
		// 状态
		loading,
		isMobile,
		tableData,
		domainName,

		// 表格
		ResolveTable,
		ResolveTablePage,

		// 移动端卡片
		ResolveCardList,

		// 表单
		FilterForm,
		formFetchSearch,
		formDataReset,

		// 事件处理
		handleResolve,
		handleDelete,
		handleStatusClick,
		openTemplateChangeModal, // 导出立即实名处理函数

		// 模态框
		handleShowAddDomainModal,
		handleShowDnsModal,

		// 工具方法
		getNsStatusText,
		getNsStatusType,

		// 数据刷新
		fetchResolve,
	}
}
