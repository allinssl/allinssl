/**
 * Dashboard 仪表板页面
 * 职责：渲染仪表板UI界面，展示概览数据、域名状态、订单信息和系统通知
 */

import { defineComponent, onMounted } from 'vue'
import { NCard, NGrid, NGridItem, NButton, NTag, NIcon, NAlert, NSkeleton, NFlex, NEmpty, NSelect } from 'naive-ui'
import { CheckCircle, Clock, AlertTriangle, Wallet, Plus, Server, CreditCard, FileText } from 'lucide-vue-next'
import { useApp } from '@/components/layout/useStore'
import { useDashboardController } from './useController'

import type { DomainOverviewItem } from './types.d'
import type { INotificationItem } from '@/components/layout/types'
import { BagHandleOutline, TrashBinOutline } from '@vicons/ionicons5'

/**
 * Dashboard 仪表板组件
 */
export default defineComponent({
	name: 'Dashboard',
	setup() {
		// ==================== 控制器 ====================
		const {
			state,
			getDomainStatusType,
			getDomainStatusText,
			getDomainStatusColor,
			getOrderTypeText,
			getOrderStatusType,
			getOrderStatusText,
			getNotificationIcon,
			getNotificationIconColor,
			loadDashboardData,
			handleActionClick,
			handleCardClick,
			handleViewAllOrders,
			handleViewAllDomains,
			loadCartList,
			removeFromCart,
			updateCartYear,
			openCheckoutModal,
		} = useDashboardController()

		const { isLoading, overviewCards, dashboardData, quickActions, cartListInfo, cartLoading } = state

		const handleRemoveFromCart = async (id: number | string) => {
			if (!id) return
			await removeFromCart(Number(id))
		}

		// 年限选择器选项
		const yearOptions = [
			{ label: '1年', value: 1 },
			{ label: '2年', value: 2 },
			{ label: '3年', value: 3 },
			{ label: '5年', value: 5 },
			{ label: '10年', value: 10 },
		]

		const handleCheckout = () => { openCheckoutModal() }

		// ==================== 移动端状态 ====================
		const { isMobile } = useApp()

		// ==================== 生命周期 ====================
		onMounted(async () => {
			await loadDashboardData()
			await loadCartList()
		})

		// ==================== 渲染函数 ====================
		/**
		 * 渲染概览卡片
		 */
		const renderOverviewCards = () => {
			return (
				<NGrid cols={isMobile.value ? 1 : 3} xGap="16px" yGap="16px" responsive="screen">
					{overviewCards.value.map((card) => (
						<NGridItem key={card.title}>
							<NCard
								hoverable
								class="card-shadow card-shadow-hover cursor-pointer transition-all duration-300 h-full"
								bordered={false}
							>
								<div class="flex items-center gap-4" onClick={() => handleCardClick(card.path)}>
									<div class="flex-shrink-0 flex items-center justify-center w-15 h-15 rounded-3 bg-green-500/10">
										<NIcon color={card.iconColor} size={32}>
											{{
												default: () => {
													const IconComponent = {
														CheckCircle,
														Clock,
														AlertTriangle,
														Wallet,
													}[card.icon]
													return IconComponent ? <IconComponent /> : null
												},
											}}
										</NIcon>
									</div>
									<div class="flex-1 text-left">
										<div class="text-sm text-gray-600 mb-0.5">{card.title}</div>
										<div class="text-2xl font-bold leading-tight mb-1">{card.value || 0}</div>
										<div class="text-xs text-gray-400">{card.description}</div>
									</div>
								</div>
							</NCard>
						</NGridItem>
					))}
				</NGrid>
			)
		}

		/**
		 * 渲染域名状态概览
		 */
		const renderDomainOverview = () => {
			return (
				<NCard title="域名状态概览" class="card-shadow h-full " bordered={false}>
					{{
						'header-extra': () => (
							<NButton
								text
								size="small"
								class="text-xs text-gray-600 hover:text-green-500"
								onClick={handleViewAllDomains}
							>
								查看全部
							</NButton>
						),
						default: () => {
							// 使用固定的响应式布尔值判断空态，禁止在模板中直接判断数组长度
							if (isLoading.value) {
								return (
									<div class="space-y-3">
										{Array.from({ length: 3 }).map((_, i) => (
											<div key={i} class="px-4 py-4 bg-black/2 rounded-lg">
												<div class="flex items-start space-x-3">
													<div class="flex-shrink-0 mt-1">
														<NSkeleton circle size="small" />
													</div>
													<div class="flex-1">
														<NSkeleton text repeat={1} class="mb-2" style={{ width: '85%' }} />
														<NSkeleton text repeat={1} style={{ width: '30%' }} />
													</div>
												</div>
											</div>
										))}
									</div>
								)
							} else if (dashboardData.value.domains.length === 0) {
								return <NEmpty description="暂无域名数据" class="py-10  h-[240px] flex justify-center" />
							} else {
								return (
									<div class="space-y-3 h-[320px] overflow-auto">
										{dashboardData.value.domains.map((domain: DomainOverviewItem) => (
											<div
												key={domain.id}
												class="px-4 py-2 bg-black/2 rounded-lg transition-all duration-200 cursor-pointer hover:bg-black/5"
												onClick={() => handleCardClick('/domain/detail/' + domain.id)}
											>
												<div class="flex items-center justify-between">
													<div
														class="w-3 h-3 mr-4 rounded-full flex-shrink-0"
														style={{
															backgroundColor: getDomainStatusColor(domain.status),
														}}
													></div>
													<div class="flex-1">
														<div class="text-base font-bold mb-1">{domain.name}</div>
														<div class="text-xs text-gray-500">到期时间：{domain.expireDate}</div>
													</div>
													<div class="flex items-center space-x-3">
														<div class="flex items-center space-x-2">
															<NTag type={getDomainStatusType(domain.status)} size="small" bordered={false}>
																{getDomainStatusText(domain.status)}
															</NTag>
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								)
							}
						},
					}}
				</NCard>
			)
		}

		/**
		 * 渲染快捷操作
		 */
		const renderQuickActions = () => {
			return (
				<NCard title="快捷操作" class="card-shadow h-full" bordered={false}>
					<div class={`${isMobile.value ? 'h-[200px]' : 'h-[300px]'} grid grid-cols-1 gap-2`}>
						{quickActions.value.map((action) => (
							<NButton
								key={action.title}
								type={action.type}
								size="large"
								block
								text
								class="h-auto px-4 py-3.5 text-left justify-start transition-all duration-200 rounded-lg bg-black/2 hover:-translate-y-0.25 hover:bg-black/4"
								onClick={() => handleActionClick(action)}
							>
								{{
									icon: () => (
										<NIcon color={action.iconColor} size={20}>
											{{
												default: () => {
													const IconComponent = {
														Plus,
														Server,
														CreditCard,
														FileText,
													}[action.icon]
													return IconComponent ? <IconComponent /> : null
												},
											}}
										</NIcon>
									),
									default: () => <span class="font-medium">{action.title}</span>,
								}}
							</NButton>
						))}
					</div>
				</NCard>
			)
		}

		/**
		 * 渲染购物车
		 */
		const renderShoppingCart = () => {
			return (
				<NCard title="购物车" class="card-shadow h-[400px]" bordered={false}>
					{{
						default: () => {
							// 使用固定的响应式布尔值判断空态
							if (cartLoading.value) {
								return (
									<div class="space-y-3">
										{Array.from({ length: 3 }).map((_, i) => (
											<div key={i} class="px-4 py-4 bg-black/2 rounded-lg">
												<div class="flex items-start space-x-3">
													<div class="flex-shrink-0 mt-1">
														<NSkeleton circle size="small" />
													</div>
													<div class="flex-1">
														<NSkeleton text repeat={1} class="mb-2" style={{ width: '85%' }} />
														<NSkeleton text repeat={1} style={{ width: '30%' }} />
													</div>
												</div>
											</div>
										))}
									</div>
								)
							} else if (cartListInfo.value.items.length === 0) {
								return (
									<NEmpty description="购物车为空" class="py-10 h-[240px] flex justify-center">
										{{
											icon: () => (
												<NIcon>
													{{
														default: () => {
															return <BagHandleOutline />
														},
													}}
												</NIcon>
											),
										}}
									</NEmpty>
								)
							} else {
								return (
									<>
										<div class="space-y-3 h-[260px] overflow-auto">
											{cartListInfo.value.items.map((item) => (
												<div key={item.id} class="px-4 py-4 bg-black/2 rounded-lg transition-all duration-200">
													<div class="grid grid-cols-2 gap-2">
														{/* 左上：域名名称 */}
														<div class="font-medium text-base">{item.full_domain}</div>

														{/* 右上：价格，右对齐，黑色 */}
														<div class="text-black text-sm text-right">¥{item.price || 0}</div>

														{/* 左下：年限选择器 */}
														<div>
															<NSelect
																size="small"
																options={yearOptions}
																value={item.years || 1}
																style={{ width: '80px' }}
																onUpdateValue={(value) => updateCartYear(item, value as number)}
															/>
														</div>

														{/* 右下：移除按钮，右对齐，文字形式 */}
														<div class="text-right">
															<NButton
																text
																size="small"
																class="text-black hover:!text-red-500 transition-colors"
																onClick={() => handleRemoveFromCart(item.id!)}
															>
																移除
															</NButton>
														</div>
													</div>
												</div>
											))}
										</div>

										{/* 去添加更多域名按钮 | 购物车合计与结算 */}
										<div class="flex justify-between items-center">
											<NButton
												text
												class="text-black hover:text-green-500 transition-colors"
												onClick={() => window.open('https://www.bt.cn/new/domain-register.html', '_blank')}
											>
												去添加更多域名
											</NButton>
											<div class="flex items-center justify-end gap-4">
												<div class="text-lg font-bold text-[#f0a020]">
													总计：¥{cartListInfo.value.total_price}
												</div>
												<NButton type="success" onClick={handleCheckout}>
													结算
												</NButton>
											</div>
										</div>
									</>
								)
							}
						},
					}}
				</NCard>
			)
		}

		/**
		 * 渲染系统通知
		 */
		const renderNotifications = () => {
			return (
				<NCard title="系统通知" class="card-shadow h-[400px]" bordered={false}>
					{isLoading.value ? (
						<div class="space-y-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} class="px-4 py-4 bg-black/2 rounded-lg">
									<div class="flex items-start space-x-3">
										<div class="flex-shrink-0 mt-1">
											<NSkeleton circle size="small" />
										</div>
										<div class="flex-1">
											<NSkeleton text repeat={1} class="mb-2" style={{ width: '85%' }} />
											<NSkeleton text repeat={1} style={{ width: '30%' }} />
										</div>
									</div>
								</div>
							))}
						</div>
					) : dashboardData.value.notifications.length === 0 ? (
						<NEmpty description="暂无系统通知" class="py-10  h-[240px] flex justify-center" />
					) : (
						<div class="space-y-3 h-[300px] overflow-auto">
							{dashboardData.value.notifications.map((notification: INotificationItem) => (
								<div key={notification.id} class="px-4 py-4 bg-black/2 rounded-lg transition-all duration-200">
									<div class="flex items-start space-x-3">
										<div class="flex-shrink-0 mt-1">
											<NIcon color={getNotificationIconColor(notification.type)} size={18}>
												{{
													default: () => {
														const IconComp = getNotificationIcon(notification.type)
														return IconComp ? <IconComp /> : null
													},
												}}
											</NIcon>
										</div>
										<div class="flex-1">
											<div class="text-sm mb-1">{notification.content}</div>
											<div class="text-xs text-gray-400">{notification.time}</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</NCard>
			)
		}

		// ==================== 主渲染函数 ====================
		return () => (
			<div class="flex flex-col gap-[16px]">
				{/* 顶部提示信息 */}
				<NAlert type="error" showIcon={false} class="rounded-lg card-shadow transition-all duration-300">
					<div class="flex flex-row items-center text-orange-700">
						<NIcon class="text-2xl mx-3">
							<AlertTriangle />
						</NIcon>
						<div class="flex flex-col text-orange-700">
							<div class="text-sm">请确保实名认证信息完整且准确，否则可能影响域名归属及使用</div>
							<div class="text-sm">实名认证完成后至少 72 小时才可进行网站备案，详情请咨询相关备案平台。</div>
						</div>
					</div>
				</NAlert>
				{/* 数据总览卡片 */}
				{renderOverviewCards()}

				<div class="grid grid-cols-12 gap-4">
					{/* 左侧内容 */}
					<div class="col-span-12">
						{/* 域名状态概览 */}
						<div class="mb-4 grid grid-cols-12 gap-4">
							<div class="col-span-12 lg:col-span-8">
								{/* 渲染域名状态概览 */}
								{renderDomainOverview()}
							</div>
							{/* 快捷操作卡片 */}
							<div class="col-span-12 lg:col-span-4">
								{/* 渲染快捷操作卡片 */}
								{renderQuickActions()}
							</div>
						</div>

						{/* 最近订单和系统通知并排显示 */}
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{/* 购物车 */}
							{renderShoppingCart()}
							{/* 系统通知 */}
							{renderNotifications()}
						</div>
					</div>
				</div>
			</div>
		)
	},
})
