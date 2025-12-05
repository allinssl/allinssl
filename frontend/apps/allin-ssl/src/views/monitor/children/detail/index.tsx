import { defineComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NCard, NSpin, NIcon, NSpace, NText, NEmpty, NDataTable, NPagination } from 'naive-ui'
import { ArrowLeft, Information, ErrorOutline } from '@vicons/carbon'
import { CloseCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, GlobalOutlined } from '@vicons/antd'
import { useThemeCssVar, useTheme } from '@baota/naive-ui/theme'
import { useTable } from '@baota/naive-ui/hooks'

// 工具和钩子
import { useError } from '@baota/hooks/error'

// API和类型
import { getMonitorDetail, getMonitorErrorRecord } from '@/api/monitor'
import type { MonitorDetailInfo, ErrorRecord, GetErrorRecordParams, CertChainNode } from '@/types/monitor'

// 样式
import styles from './index.module.css'

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

		// 错误记录表格配置
		const errorColumns = [
			{
				title: () => <span class="font-semibold">错误时间</span>,
				key: 'create_time',
				width: 200,
				render: (row: ErrorRecord) => (
					<span class="text-[1.3rem] sm:text-[1.4rem] font-mono">{formatDateTime(row.create_time)}</span>
				),
			},
			{
				title: () => <span class="font-semibold">错误消息</span>,
				key: 'msg',
				render: (row: ErrorRecord) => (
					<div class="text-[1.3rem] sm:text-[1.4rem] text-red-600 dark:text-red-400 break-words leading-relaxed">
						<div class="max-w-full overflow-hidden">
							<div class="whitespace-pre-wrap break-all">{row.msg || '-'}</div>
						</div>
					</div>
				),
			},
		]

		// 错误记录请求函数
		const errorRecordRequest = async <T = ErrorRecord,>(params: GetErrorRecordParams) => {
			try {
				const apiInstance = getMonitorErrorRecord(params)
				const response = await apiInstance.fetch()
				const { data, count } = response

				const result = {
					list: (data || []) as T[],
					total: count || 0,
				}
				return result
			} catch (error: unknown) {
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
			// 使用useTable的fetch方法加载数据
			try {
				await fetchErrorList()
			} catch {
				// 错误处理已在errorRecordRequest中处理
			}
		})

		return () => (
			<NCard
				title={ () => <h1 class="text-[1.8rem] font-semibold">错误列表</h1> }
				class="h-fit [&_.n-card-header_.n-card-header__main]:text-[1.5rem] [&_.n-card-header_.n-card-header__main]:font-medium !bg-[var(--content-bg-base)]"
				bordered
			>
				{{
					'header-extra': () => (
						<NIcon size="20" color="var(--n-error-color)">
							<ErrorOutline />
						</NIcon>
					),
					default: () => (
						<div class="space-y-3">
							<NSpin show={errorLoading.value}>
								<TableComponent>
									{{
										empty: () => (
											<NEmpty
												description="暂无错误记录"
												size="large"
												class="[&_.n-empty__description]:text-[1.4rem] py-6"
											>
												{{
													icon: () => (
														<NIcon size="40" color="var(--n-text-color-disabled)">
															<ErrorOutline />
														</NIcon>
													),
												}}
											</NEmpty>
										),
									}}
								</TableComponent>
							</NSpin>
							<div class="flex justify-end mt-3">
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
		const { isDark } = useTheme();

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
			'textColorSecondary',
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
			if (daysLeft <= 7) return 'var(--n-error-primary-color)'
			if (daysLeft <= 30) return 'var(--n-warning-primary-color)'
			return 'var(--n-success-primary-color)'
		}

		/**
		 * 统一的状态主题方案（success / warning / error）
		 */
		const getScheme = (type: 'success' | 'warning' | 'error') => {
			if (type === 'success') {
				return {
					iconBgClass: 'bg-[#D8FFE4]',
					style: {
						backgroundColor: 'var(--n-success-bg-color-light)',
						color: 'var(--n-success-primary-color)',
						borderColor: 'var(--n-success-border-color)',
					},
					labelStyle: { color: 'var(--n-success-text-color)' },
				}
			}
			if (type === 'warning') {
				return {
					iconBgClass: 'bg-[#fff4e2]',
					style: {
						backgroundColor: 'var(--n-warning-bg-color-light)',
						color: 'var(--n-warning-primary-color)',
						borderColor: 'var(--n-warning-primary-color)',
					},
					labelStyle: { color: 'var(--n-warning-primary-color)' },
				}
			}
			return {
				iconBgClass: 'bg-[#FFE7E7]',
				style: {
					backgroundColor: 'var(--n-error-bg-color-light)',
					color: 'var(--n-error-primary-color)',
					borderColor: 'var(--n-error-border-color)',
				},
				labelStyle: { color: 'var(--n-error-text-color)' },
			}
		}


		const CoreStatusCard = ref([
			{
				label: '当前状态',
				icon: <CheckCircleOutlined />,
				class: 'border',
				getThemeType: () => (detailData.value?.valid === 1 ? 'success' : 'error'),
				render: () => detailData.value ? (
					<span>
						{getValidStatus(detailData.value.valid).text}
					</span>
				) : '-'
			},
			{
				label: '剩余天数',
				icon: <ClockCircleOutlined />,
				class: 'border',
				getThemeType: () => {
					const d = detailData.value?.days_left ?? 0
					if (d <= 7) return 'error'
					if (d <= 30) return 'warning'
					return 'success'
				},
				render: () => detailData.value ? (
					<span style={{ color: getDaysLeftColor(detailData.value.days_left) }}>
						{detailData.value.days_left} 天
					</span>
				) : '-'
			},
			{
				label: '错误次数',
				iconBgClass: 'bg-[#fff4e2] text-[#FF9D00]',
				icon: <CloseCircleOutlined />,
				render: () => `${detailData.value?.err_count || 0} 次`
			},
			{
				label: '协议类型',
				iconBgClass: 'bg-[#E6F1FF] text-[#3B82F6]',
				icon: <GlobalOutlined />,
				render: () => detailData.value?.monitor_type || '-',
				uppercase: true
			},
		])


		const ValidPeriodCard = ref([
			{
				label: '生效时间',
				labelColor: '#67C23A',
				render: () => formatDateTime(detailData.value?.not_before || ''),
				class: 'font-mono',
			},
			{
				label: '到期时间',
				labelColor: '#FF9D00',
				render: () => formatDateTime(detailData.value?.not_after || ''),
				class: 'font-mono',
			},
			{
				label: '距离到期',
				labelColor: '#EF4444',
				render: () => detailData.value ? (
					<span>
						{detailData.value.days_left} 天
					</span>
				) : '-',
				class: '',
			},
			{
				label: '证书有效期范围',
				labelColor: '#3B82F6',
				class: 'font-mono whitespace-nowrap',
				render: () => formatValidityPeriod(
					detailData.value?.not_before || '',
					detailData.value?.not_after || '',
				),
			},
		])
		/**
		 * 递归渲染证书链节点
		 */
		const renderCertChainNode = (node: CertChainNode, level: number = 0, index: number = 0) => {

			// 确定证书类型和样式
			const getCertTypeInfo = (level: number, hasChildren: boolean) => {
				if (level === 0) {
					return {
						label: '终端证书',
						color: 'bg-green-500',
						border: 'border-green-500',
						lineColorHex: '#22c55e',
					}
				} else if (hasChildren) {
					return {
						label: `中间证书 #${index + 1}`,
						color: 'bg-blue-500',
						border: 'border-blue-500',
						lineColorHex: '#3b82f6',
					}
				} else {
					return {
						label: '根证书',
						color: 'bg-purple-500',
						border: 'border-purple-500',
						lineColorHex: '#a855f7',
					}
				}
			}

			const hasChildren = Boolean(node.children && node.children.length > 0)
			const typeInfo = getCertTypeInfo(level, hasChildren)

				return (
					<div key={`cert-wrap-${level}-${index}`} class="relative" style={{ paddingLeft: `${level * 2}rem` }}>
					{hasChildren && (
						<div
							class="absolute"
							style={{
								top: '36px',
								bottom: 0,
								left: `calc(${level * 2}rem + 9px)`, // 对齐圆点中心（增大每级间距）
								width: '2px',
								backgroundColor: (typeInfo as any).lineColorHex ?? '#3b82f6',
							}}
						/>
					)}

					{/* 行内容 */}
					<div class="flex items-center space-x-6 p-2">
						<div class={`w-4 h-4 rounded-full flex-shrink-0 border-2 ${typeInfo.border}`}></div>
						<div class="flex-1">
							<span class={`text-[1.4rem] font-bold`}>{typeInfo.label}</span>
							<div class="font-mono break-words text-color3">
								{node.common_name}
							</div>
						</div>
					</div>

					{/* 子节点 */}
					{hasChildren && node.children!.map((child: CertChainNode, childIndex: number) => (
						renderCertChainNode(child, level + 1, childIndex)
					))}
				</div>
			)
		}

		// 组件挂载时获取数据
		onMounted(() => {
			fetchDetailData()
		})

		return () => (
			<div class="mx-auto max-w-[1800px] w-full p-3 sm:p-4 lg:p-6" style={cssVars.value}>
				<NSpin show={loading.value}>
					{/* 页面头部 */}
					<div class="mb-4 sm:mb-5">
						<NSpace align="center" class="mb-3 sm:mb-4">
							<NButton
								size="medium"
								type="default"
								onClick={goBack}
								class="text-[1.3rem] sm:text-[1.4rem] gradient-default-btn"
								renderIcon={() => (
									<NIcon>
										<ArrowLeft />
									</NIcon>
								)}
							>
								返回监控列表
							</NButton>
						</NSpace>
					</div>

          {/* 内容区域 */}
          {detailData.value ? (
            <div class="space-y-4 sm:space-y-5 lg:space-y-6">
              {/* 合并的监控和证书详情模块 */}
              <NCard
                title={() => (
                  <h1 class="text-[1.8rem] sm:text-[1.8rem] lg:text-[1.8rem] font-semibold break-words leading-tight">
                    {detailData.value?.name || "监控详情"} - 证书详情
                  </h1>
                )}
                class="[&_.n-card-header_.n-card-header__main]:text-[1.5rem] [&_.n-card-header_.n-card-header__main]:font-medium !bg-[var(--content-bg-base)]"
                bordered
              >
                {{
                  "header-extra": () => (
                    <span class={styles.headerIcon}>
                      <NIcon size="24">
                        <Information />
                      </NIcon>
                    </span>
                  ),
                  default: () => (
                    <div class="space-y-6">
                      {/* 核心状态信息 - 最重要 */}
                      <div class="pb-6">
                        <h4 class="font-semibold mb-6 text-primary text-[1.6rem] sm:text-[1.7rem] border-b border-[var(--n-border-color)] pb-4">
                          核心状态
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {CoreStatusCard.value.map((card, index) => {
                            const theme: any = card.getThemeType
                              ? getScheme(card.getThemeType())
                              : {
                                  iconBgClass: (card as any).iconBgClass || "",
                                  style: (card as any).style || {},
                                  labelStyle: (card as any).labelStyle || {},
                                };

                            // 简化判断：只对前两个元素应用样式类
                            const shouldApplyStyles = index < 2;
                            const themeType = card.getThemeType?.();
                            const isSuccess = shouldApplyStyles && themeType === "success";
                            const isError = shouldApplyStyles && themeType === "error";

                            return (
                              <div
                                key={index}
                                class={`${styles.coreStatusCard} ${
                                  isSuccess ? styles.coreStatusCardSuccess : ""
                                } ${
                                  isError ? styles.coreStatusCardError : ""
                                } flex flex-row items-center gap-4 p-6 rounded-xl ${
                                  card.class || ""
                                }`}
                                style={theme.style}
                              >
                                <span
                                  class={`${styles.coreStatusIcon} ${
                                    isSuccess
                                      ? styles.coreStatusIconSuccess
                                      : ""
                                  } ${
                                    isError
                                      ? styles.coreStatusIconError
                                      : ""
                                  } w-[48px] h-[48px] rounded-[6px] overflow-hidden flex items-center justify-center ${
                                    theme.iconBgClass || ""
                                  }`}
                                >
                                  <NIcon size="36">{card.icon}</NIcon>
                                </span>
                                <div>
                                  <div
                                    class={`font-bold text-[1.5rem] sm:text-[1.6rem] ${
                                      card.uppercase ? "uppercase" : ""
                                    } ${
                                      isError ? styles.coreStatusTextError : ""
                                    }`}
                                  >
                                    {card.render()}
                                  </div>
                                  <span
                                    class={`text-[1.2rem] sm:text-[1.4rem] font-medium text-color5 ${
                                      isSuccess
                                        ? styles.coreStatusLabelSuccess
                                        : ""
                                    } ${
                                      isError
                                        ? styles.coreStatusLabelError
                                        : ""
                                    }`}
                                    style={{
                                      ...theme.labelStyle,
                                      ...(isDark.value && index === 2 && { color: "#FF9D00" }),
                                      ...(isDark.value && index === 3 && { color: "#3B82F6" }),
                                    }}
                                  >
                                    {card.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

											{/* 监控配置信息 */}
											<div class="pb-6">
												<h4 class="font-semibold mb-6 text-primary text-[1.6rem] sm:text-[1.7rem] border-b border-[var(--n-border-color)] pb-4">
													监控配置
												</h4>
												<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
													<div class="space-y-4">
														<div class="p-4 rounded-lg">
															<NText depth="3" class="text-[1.4rem] font-medium">
																监控名称
															</NText>
															<div class="mt-2 font-[600] text-[1.4rem] sm:text-[1.5rem] break-words">
																{detailData.value?.name || '-'}
															</div>
														</div>
														<div class="p-4 rounded-lg">
															<NText depth="3" class="text-[1.4rem] font-medium">
																监控目标
															</NText>
															<div class="mt-2 font-[600] text-[1.4rem] sm:text-[1.5rem]">
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
													<div class="space-y-4">
														<div class="p-4 rounded-lg">
															<NText depth="3" class="text-[1.4rem] font-medium">
																证书颁发机构
															</NText>
															<div class="mt-2 font-[600] text-[1.4rem] sm:text-[1.5rem]">
																{detailData.value?.ca || '-'}
															</div>
														</div>
														<div class="p-4 rounded-lg">
															<NText depth="3" class="text-[1.4rem] font-medium">
																上次检测时间
															</NText>
															<div class="mt-2 font-[600] text-[1.4rem] sm:text-[1.5rem] break-words">
																{formatDateTime(detailData.value?.last_time || '')}
															</div>
														</div>
														{detailData.value?.tls_version && (
															<div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
																<NText depth="3" class="text-[1.3rem] sm:text-[1.4rem] font-medium">
																	支持的TLS版本
																</NText>
																<div class="mt-2 font-[600] text-[1.4rem] sm:text-[1.5rem]">
																	{detailData.value.tls_version}
																</div>
															</div>
														)}
													</div>
												</div>
											</div>

											{/* 证书基本信息 */}
											<div class="pb-6">
												<h4 class="font-semibold mb-6 text-success text-[1.6rem] sm:text-[1.7rem] border-b border-[var(--n-border-color)] pb-4">
													证书基本信息
												</h4>
												<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
													<div>
														<NText
															depth="3"
															class="text-[1.4rem] font-medium"
														>
															通用名称 (CN)
														</NText>
														<div class="mt-2 font-mono font-[600] text-[1.4rem] sm:text-[1.5rem] break-all leading-relaxed">
															{detailData.value?.common_name || '-'}
														</div>
													</div>
													<div>
														<NText
															depth="3"
															class="text-[1.4rem] font-medium"
														>
															主题备用名称 (SAN)
														</NText>
														<div class="mt-2 font-mono font-[600] text-[1.4rem] sm:text-[1.5rem] break-all leading-relaxed">
															{detailData.value?.sans || '-'}
														</div>
													</div>
												</div>
											</div>

											{/* 有效期详情 */}
											<div class="pb-6">
												<h4 class="font-semibold mb-6 text-success text-[1.6rem] sm:text-[1.7rem] border-b border-[var(--n-border-color)] pb-4">
													有效期详情
												</h4>
												<div class="flex flex-wrap gap-4">
													{ValidPeriodCard.value.map((card, index) => (
														<div 
															key={index} 
															class={`border-l-[6px] pl-4 min-w-0`}
															style={{ 
																borderLeftColor: card.labelColor,
																flex: index === 3 ? '1 1 auto' : '1 0 auto',
															}}
														>
															<div class={`font-semibold text-[1.6rem] ${card.class || ''}`}>
																{card.render()}
															</div>
															<NText depth="3" class="mt-2 text-[1.2rem]">
																{card.label}
															</NText>
														</div>
													))}
												</div>
											</div>

											{/* 证书链路信息 - 视觉增强 */}
											{detailData.value?.cert_chain && (
												<div>
													<h4 class="font-semibold mb-6 text-success text-[1.6rem] sm:text-[1.7rem] border-b border-[var(--n-border-color)] pb-4">
														证书链路信息
													</h4>
													<div class="">
														<div class="space-y-4">{renderCertChainNode(detailData.value.cert_chain)}</div>
													</div>
												</div>
											)}

											{/* 验证错误信息 */}
											{detailData.value?.verify_error && (
												<div>
													<h4 class="font-semibold mb-6 text-error text-[1.6rem] border-[var(--n-border-color)] border-b border-error/20 pb-4">
														验证错误信息
													</h4>
													<div class="">
														<div class="text-red-600 leading-relaxed break-words">
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
							<NCard bordered class="text-center [&_.n-empty__description]:text-[1.4rem] !bg-[var(--content-bg-base)]">
								<NEmpty description="未找到监控详情数据" size="large">
									{{
										extra: () => (
											<NButton type="primary" class="text-[1.3rem]" onClick={goBack}>
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
