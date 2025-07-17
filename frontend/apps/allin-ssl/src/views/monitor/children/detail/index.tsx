import { defineComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NCard, NSpin, NIcon, NSpace, NText, NEmpty, NDataTable, NPagination } from 'naive-ui'
import { ArrowLeft, Information, ErrorOutline } from '@vicons/carbon'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { useTable } from '@baota/naive-ui/hooks'

// 工具和钩子
import { useError } from '@baota/hooks/error'

// API和类型
import { getMonitorDetail, getMonitorErrorRecord } from '@/api/monitor'
import type { MonitorDetailInfo, ErrorRecord, GetErrorRecordParams, CertChainNode } from '@/types/monitor'

/**
 * 错误列表卡片组件
 */
const ErrorListCard = defineComponent({
	name: 'ErrorListCard',
	props: {
		monitorId: {
			type: Number,
			required: true,
		},
	},
	setup(props) {
		const { handleError } = useError()

		/**
		 * 格式化日期时间
		 */
		const formatDateTime = (dateStr: string): string => {
			if (!dateStr) return '-'
			return new Date(dateStr).toLocaleString('zh-CN')
		}

		console.log('ErrorListCard 渲染，monitorId:', props.monitorId)

		// 错误记录表格配置
		const errorColumns = [
			{
				title: '错误时间',
				key: 'create_time',
				width: 200,
				render: (row: ErrorRecord) => (
					<span class="text-[1.4rem] sm:text-[1.5rem] font-mono">{formatDateTime(row.create_time)}</span>
				),
			},
			{
				title: '错误消息',
				key: 'msg',
				render: (row: ErrorRecord) => (
					<div class="text-[1.4rem] sm:text-[1.5rem] text-red-600 dark:text-red-400 break-words leading-relaxed">
						<div class="max-w-full overflow-hidden">
							<div class="whitespace-pre-wrap break-all">{row.msg || '-'}</div>
						</div>
					</div>
				),
			},
		]

		// 错误记录请求函数
		const errorRecordRequest = async <T = ErrorRecord,>(params: GetErrorRecordParams) => {
			console.log('🔍 错误记录请求开始，参数:', params)
			console.log('🔍 API端点: /v1/monitor/get_err_record')
			try {
				const apiInstance = getMonitorErrorRecord(params)
				console.log('🔍 API实例创建成功:', apiInstance)

				const response = await apiInstance.fetch()
				console.log('✅ 错误记录API响应成功:', response)

				const { data, count, status, message } = response
				console.log('📊 响应详情:', { data, count, status, message })

				const result = {
					list: (data || []) as T[],
					total: count || 0,
				}
				console.log('🎯 错误记录处理结果:', result)
				return result
			} catch (error: unknown) {
				console.error('❌ 错误记录请求失败:', error)
				if (error instanceof Error) {
					console.error('❌ 错误消息:', error.message)
					console.error('❌ 错误堆栈:', error.stack)
				}
				handleError(error).default('获取错误记录失败，请稍后重试')
				return { list: [] as T[], total: 0 }
			}
		}

		// 创建表格实例
		const {
			TableComponent,
			PageComponent,
			loading: errorLoading,
			fetch: fetchErrorList,
		} = useTable<ErrorRecord, GetErrorRecordParams>({
			config: errorColumns,
			request: errorRecordRequest,
			defaultValue: ref({
				id: props.monitorId,
				p: 1,
				limit: 10,
			}),
			alias: { page: 'p', pageSize: 'limit' },
			watchValue: ['p', 'limit'], // 监听分页参数变化
		})

		// 组件挂载时加载错误记录
		onMounted(async () => {
			console.log('🚀 ErrorListCard 挂载，开始加载错误记录')
			console.log('🚀 监控ID:', props.monitorId)

			// 使用useTable的fetch方法加载数据
			try {
				console.log('📊 使用useTable fetch方法...')
				await fetchErrorList()
				console.log('✅ 错误记录加载完成')
			} catch (error) {
				console.error('❌ 错误记录加载失败:', error)
			}
		})

		return () => (
			<NCard
				title="错误列表"
				class="h-fit [&_.n-card-header_.n-card-header__main]:text-[1.8rem] [&_.n-card-header_.n-card-header__main]:font-medium"
				bordered
			>
				{{
					'header-extra': () => (
						<NIcon size="20" color="var(--n-error-color)">
							<ErrorOutline />
						</NIcon>
					),
					default: () => (
						<div class="space-y-4">
							<NSpin show={errorLoading.value}>
								<TableComponent>
									{{
										empty: () => (
											<NEmpty
												description="暂无错误记录"
												size="large"
												class="[&_.n-empty__description]:text-[1.6rem] py-8"
											>
												{{
													icon: () => (
														<NIcon size="48" color="var(--n-text-color-disabled)">
															<ErrorOutline />
														</NIcon>
													),
												}}
											</NEmpty>
										),
									}}
								</TableComponent>
							</NSpin>
							<div class="flex justify-end mt-4">
								<PageComponent />
							</div>
						</div>
					),
				}}
			</NCard>
		)
	},
})

/**
 * @component MonitorDetailView
 * @description 监控详情页面组件
 * 负责展示监控的详细信息，包括基本信息和证书内容信息
 */
export default defineComponent({
	name: 'MonitorDetailView',
	setup() {
		const route = useRoute()
		const router = useRouter()
		const { handleError } = useError()

		// 响应式数据
		const loading = ref(false)
		const detailData = ref<MonitorDetailInfo | null>(null)
		const monitorId = ref<number>(Number(route.query.id))

		// 获取主题CSS变量
		const cssVars = useThemeCssVar([
			'contentPadding',
			'borderColor',
			'headerHeight',
			'iconColorHover',
			'successColor',
			'errorColor',
			'warningColor',
			'primaryColor',
		])

		/**
		 * 返回监控列表页面
		 */
		const goBack = (): void => {
			router.push('/monitor')
		}

		/**
		 * 获取监控详情数据
		 */
		const fetchDetailData = async (): Promise<void> => {
			if (!monitorId.value) {
				handleError(new Error('监控ID无效')).default('无效的监控ID，请返回监控列表重试')
				return
			}

			try {
				loading.value = true
				const { data, status } = await getMonitorDetail({ id: monitorId.value }).fetch()

				if (status && data) {
					detailData.value = data
				} else {
					handleError(new Error('获取监控详情失败')).default('获取监控详情失败，请稍后重试')
				}
			} catch (error) {
				handleError(error).default('获取监控详情失败，请稍后重试')
			} finally {
				loading.value = false
			}
		}

		/**
		 * 格式化日期时间
		 */
		const formatDateTime = (dateStr: string): string => {
			if (!dateStr) return '-'
			return new Date(dateStr).toLocaleString('zh-CN')
		}

		/**
		 * 格式化证书有效期范围
		 */
		const formatValidityPeriod = (notBefore: string, notAfter: string): string => {
			if (!notBefore || !notAfter) return '-'
			const startDate = formatDateTime(notBefore)
			const endDate = formatDateTime(notAfter)
			return `${startDate} 至 ${endDate}`
		}

		/**
		 * 获取验证状态显示文本和颜色
		 */
		const getValidStatus = (valid: number) => {
			return valid === 1
				? { text: '有效', color: 'var(--n-success-color)' }
				: { text: '无效', color: 'var(--n-error-color)' }
		}

		/**
		 * 获取剩余天数的颜色
		 */
		const getDaysLeftColor = (daysLeft: number): string => {
			if (daysLeft <= 7) return 'var(--n-error-color)'
			if (daysLeft <= 30) return 'var(--n-warning-color)'
			return 'var(--n-success-color)'
		}

		/**
		 * 递归渲染证书链节点
		 */
		const renderCertChainNode = (node: CertChainNode, level: number = 0, index: number = 0): JSX.Element[] => {
			const elements: JSX.Element[] = []

			// 确定证书类型和样式
			const getCertTypeInfo = (level: number, hasChildren: boolean) => {
				if (level === 0) {
					return {
						label: '终端证书',
						color: 'bg-green-500',
						textColor: 'text-green-700 dark:text-green-400',
					}
				} else if (hasChildren) {
					return {
						label: `中间证书 #${index + 1}`,
						color: 'bg-blue-500',
						textColor: 'text-blue-700 dark:text-blue-400',
					}
				} else {
					return {
						label: '根证书',
						color: 'bg-purple-500',
						textColor: 'text-purple-700 dark:text-purple-400',
					}
				}
			}

			const typeInfo = getCertTypeInfo(level, node.children && node.children.length > 0)

			// 渲染当前节点
			elements.push(
				<div
					key={`cert-${level}-${index}`}
					class="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
					style={{ marginLeft: `${level * 1.5}rem` }}
				>
					<div class={`w-3 h-3 ${typeInfo.color} rounded-full flex-shrink-0 shadow-sm`}></div>
					<div class="flex-1">
						<span class={`text-[1.4rem] sm:text-[1.5rem] font-medium ${typeInfo.textColor}`}>{typeInfo.label}</span>
						<div class="text-[1.3rem] sm:text-[1.4rem] text-gray-600 dark:text-gray-400 font-mono mt-1 break-words">
							{node.common_name}
						</div>
					</div>
				</div>,
			)

			// 递归渲染子节点
			if (node.children && node.children.length > 0) {
				node.children.forEach((child: CertChainNode, childIndex: number) => {
					elements.push(...renderCertChainNode(child, level + 1, childIndex))
				})
			}

			return elements
		}

		// 组件挂载时获取数据
		onMounted(() => {
			fetchDetailData()
		})

		return () => (
			<div class="mx-auto max-w-[1800px] w-full p-4 sm:p-6 lg:p-8" style={cssVars.value}>
				<NSpin show={loading.value}>
					{/* 页面头部 */}
					<div class="mb-6 sm:mb-8">
						<NSpace align="center" class="mb-4 sm:mb-5">
							<NButton
								size="medium"
								type="default"
								onClick={goBack}
								class="text-[1.4rem] sm:text-[1.5rem]"
								renderIcon={() => (
									<NIcon>
										<ArrowLeft />
									</NIcon>
								)}
							>
								返回监控列表
							</NButton>
						</NSpace>
						<h1 class="text-[2.2rem] sm:text-[2.4rem] lg:text-[2.6rem] font-semibold text-gray-800 dark:text-gray-200 break-words leading-tight">
							{detailData.value?.name || '监控详情'} - 证书详情
						</h1>
					</div>

					{/* 内容区域 */}
					{detailData.value ? (
						<div class="space-y-6 sm:space-y-8 lg:space-y-10">
							{/* 合并的监控和证书详情模块 */}
							<NCard
								title="监控详情与证书信息"
								class="[&_.n-card-header_.n-card-header__main]:text-[1.8rem] [&_.n-card-header_.n-card-header__main]:font-medium"
								bordered
							>
								{{
									'header-extra': () => (
										<NIcon size="24" color="var(--n-primary-color)">
											<Information />
										</NIcon>
									),
									default: () => (
										<div class="space-y-10">
											{/* 核心状态信息 - 最重要 */}
											<div>
												<h4 class="font-semibold mb-6 text-primary text-[1.9rem] sm:text-[2rem] border-b-2 border-primary/20 pb-3">
													核心状态
												</h4>
												<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
													<div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-5 rounded-xl border border-blue-200 dark:border-blue-700">
														<NText
															depth="3"
															class="text-[1.5rem] sm:text-[1.6rem] font-medium text-blue-700 dark:text-blue-300"
														>
															当前状态
														</NText>
														<div class="mt-3 font-bold text-[1.7rem] sm:text-[1.8rem]">
															{detailData.value && (
																<span style={{ color: getValidStatus(detailData.value.valid).color }}>
																	{getValidStatus(detailData.value.valid).text}
																</span>
															)}
														</div>
													</div>
													<div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-5 rounded-xl border border-green-200 dark:border-green-700">
														<NText
															depth="3"
															class="text-[1.5rem] sm:text-[1.6rem] font-medium text-green-700 dark:text-green-300"
														>
															剩余天数
														</NText>
														<div class="mt-3 font-bold text-[1.7rem] sm:text-[1.8rem]">
															{detailData.value && (
																<span style={{ color: getDaysLeftColor(detailData.value.days_left) }}>
																	{detailData.value.days_left} 天
																</span>
															)}
														</div>
													</div>
													<div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-5 rounded-xl border border-purple-200 dark:border-purple-700">
														<NText
															depth="3"
															class="text-[1.5rem] sm:text-[1.6rem] font-medium text-purple-700 dark:text-purple-300"
														>
															错误次数
														</NText>
														<div class="mt-3 font-bold text-[1.7rem] sm:text-[1.8rem]">
															<span
																style={{
																	color:
																		(detailData.value?.err_count || 0) > 0
																			? 'var(--n-error-color)'
																			: 'var(--n-success-color)',
																}}
															>
																{detailData.value?.err_count || 0} 次
															</span>
														</div>
													</div>
													<div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-5 rounded-xl border border-orange-200 dark:border-orange-700">
														<NText
															depth="3"
															class="text-[1.5rem] sm:text-[1.6rem] font-medium text-orange-700 dark:text-orange-300"
														>
															协议类型
														</NText>
														<div class="mt-3 font-bold text-[1.7rem] sm:text-[1.8rem] uppercase">
															{detailData.value?.monitor_type || '-'}
														</div>
													</div>
												</div>
											</div>

											{/* 监控配置信息 */}
											<div>
												<h4 class="font-semibold mb-6 text-primary text-[1.9rem] sm:text-[2rem] border-b-2 border-primary/20 pb-3">
													监控配置
												</h4>
												<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
													<div class="space-y-5">
														<div class="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg">
															<NText depth="3" class="text-[1.5rem] sm:text-[1.6rem] font-medium">
																监控名称
															</NText>
															<div class="mt-3 font-medium text-[1.6rem] sm:text-[1.7rem] break-words">
																{detailData.value?.name || '-'}
															</div>
														</div>
														<div class="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg">
															<NText depth="3" class="text-[1.5rem] sm:text-[1.6rem] font-medium">
																监控目标
															</NText>
															<div class="mt-3 font-medium text-[1.6rem] sm:text-[1.7rem]">
																<a
																	href={`https://${detailData.value?.target}`}
																	target="_blank"
																	rel="noopener noreferrer"
																	class="text-primary hover:underline break-all"
																>
																	{detailData.value?.target || '-'}
																</a>
															</div>
														</div>
													</div>
													<div class="space-y-5">
														<div class="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg">
															<NText depth="3" class="text-[1.5rem] sm:text-[1.6rem] font-medium">
																证书颁发机构
															</NText>
															<div class="mt-3 font-medium text-[1.6rem] sm:text-[1.7rem]">
																{detailData.value?.ca || '-'}
															</div>
														</div>
														<div class="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg">
															<NText depth="3" class="text-[1.5rem] sm:text-[1.6rem] font-medium">
																上次检测时间
															</NText>
															<div class="mt-3 font-medium text-[1.6rem] sm:text-[1.7rem] break-words">
																{formatDateTime(detailData.value?.last_time || '')}
															</div>
														</div>
														{detailData.value?.tls_version && (
															<div class="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg">
																<NText depth="3" class="text-[1.5rem] sm:text-[1.6rem] font-medium">
																	支持的TLS版本
																</NText>
																<div class="mt-3 font-medium text-[1.6rem] sm:text-[1.7rem]">
																	{detailData.value.tls_version}
																</div>
															</div>
														)}
													</div>
												</div>
											</div>

											{/* 证书基本信息 */}
											<div>
												<h4 class="font-semibold mb-6 text-success text-[1.9rem] sm:text-[2rem] border-b-2 border-success/20 pb-3">
													证书基本信息
												</h4>
												<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
													<div class="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
														<NText
															depth="3"
															class="text-[1.5rem] sm:text-[1.6rem] font-medium text-green-700 dark:text-green-400"
														>
															通用名称 (CN)
														</NText>
														<div class="mt-3 font-mono text-[1.6rem] sm:text-[1.7rem] text-green-800 dark:text-green-300 break-all leading-relaxed">
															{detailData.value?.common_name || '-'}
														</div>
													</div>
													<div class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
														<NText
															depth="3"
															class="text-[1.5rem] sm:text-[1.6rem] font-medium text-blue-700 dark:text-blue-400"
														>
															主题备用名称 (SAN)
														</NText>
														<div class="mt-3 font-mono text-[1.6rem] sm:text-[1.7rem] text-blue-800 dark:text-blue-300 break-all leading-relaxed">
															{detailData.value?.sans || '-'}
														</div>
													</div>
												</div>
											</div>

											{/* 有效期详情 */}
											<div>
												<h4 class="font-semibold mb-6 text-success text-[1.9rem] sm:text-[2rem] border-b-2 border-success/20 pb-3">
													有效期详情
												</h4>
												<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
													<div class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-6 rounded-xl border border-green-200 dark:border-green-700">
														<NText
															depth="3"
															class="text-[1.5rem] sm:text-[1.6rem] font-medium text-green-700 dark:text-green-300"
														>
															生效时间
														</NText>
														<div class="mt-3 font-mono text-[1.6rem] sm:text-[1.7rem] text-green-600 dark:text-green-400 break-words">
															{formatDateTime(detailData.value?.not_before || '')}
														</div>
													</div>
													<div class="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 p-6 rounded-xl border border-orange-200 dark:border-orange-700">
														<NText
															depth="3"
															class="text-[1.5rem] sm:text-[1.6rem] font-medium text-orange-700 dark:text-orange-300"
														>
															到期时间
														</NText>
														<div class="mt-3 font-mono text-[1.6rem] sm:text-[1.7rem] text-orange-600 dark:text-orange-400 break-words">
															{formatDateTime(detailData.value?.not_after || '')}
														</div>
													</div>
													<div class="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 p-6 rounded-xl border border-purple-200 dark:border-purple-700 md:col-span-2 lg:col-span-1">
														<NText
															depth="3"
															class="text-[1.5rem] sm:text-[1.6rem] font-medium text-purple-700 dark:text-purple-300"
														>
															距离到期
														</NText>
														<div class="mt-3 font-bold text-[1.7rem] sm:text-[1.8rem]">
															{detailData.value && (
																<span style={{ color: getDaysLeftColor(detailData.value.days_left) }}>
																	{detailData.value.days_left} 天
																</span>
															)}
														</div>
													</div>
												</div>
												<div class="mt-6 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-lg">
													<NText depth="3" class="text-[1.5rem] sm:text-[1.6rem] font-medium">
														证书有效期范围
													</NText>
													<div class="mt-3 font-medium text-[1.6rem] sm:text-[1.7rem] break-words">
														{formatValidityPeriod(
															detailData.value?.not_before || '',
															detailData.value?.not_after || '',
														)}
													</div>
												</div>
											</div>

											{/* 证书链路信息 - 视觉增强 */}
											{detailData.value?.cert_chain && (
												<div>
													<h4 class="font-semibold mb-6 text-success text-[1.9rem] sm:text-[2rem] border-b-2 border-success/20 pb-3">
														证书链路信息
													</h4>
													<div class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-xl border border-blue-200 dark:border-blue-800">
														<div class="space-y-5">{renderCertChainNode(detailData.value.cert_chain)}</div>
													</div>
												</div>
											)}

											{/* 验证错误信息 */}
											{detailData.value?.verify_error && (
												<div>
													<h4 class="font-semibold mb-6 text-error text-[1.9rem] sm:text-[2rem] border-b-2 border-error/20 pb-3">
														验证错误信息
													</h4>
													<div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-200 dark:border-red-800">
														<div class="text-red-600 dark:text-red-300 text-[1.6rem] sm:text-[1.7rem] leading-relaxed break-words">
															{detailData.value.verify_error}
														</div>
													</div>
												</div>
											)}
										</div>
									),
								}}
							</NCard>

							{/* 错误列表模块 */}
							<ErrorListCard monitorId={monitorId.value} />
						</div>
					) : (
						!loading.value && (
							<NCard bordered class="text-center [&_.n-empty__description]:text-[1.6rem]">
								<NEmpty description="未找到监控详情数据" size="large">
									{{
										extra: () => (
											<NButton type="primary" class="text-[1.4rem]" onClick={goBack}>
												返回监控列表
											</NButton>
										),
									}}
								</NEmpty>
							</NCard>
						)
					)}
				</NSpin>
			</div>
		)
	},
})
