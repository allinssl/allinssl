/**
 * 订单管理页面
 * 职责：渲染订单管理UI界面，展示订单概览、筛选搜索、订单列表等功能
 */

import { defineComponent, ref } from 'vue'
import { NCard, NGrid, NGridItem, NIcon, NSkeleton, NFlex, NButton, NDivider } from 'naive-ui'
import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-vue-next'
import { CloseOutline, SearchOutline } from '@vicons/ionicons5'
import { useController } from './useController'

/**
 * 订单管理页面组件
 */
export default defineComponent({
	name: 'OrderManage',
	setup() {
		// ==================== 控制器 ====================
		const { loading, isMobile, overviewCards, OrderTable, OrderTablePage, OrderCardList, FilterForm, data } =
			useController()

		// 移动端搜索表单显示状态
		const showSearchForm = ref(false)

		// 切换搜索表单显示状态
		const toggleSearchForm = () => {
			showSearchForm.value = !showSearchForm.value
		}

		// ==================== 渲染函数 ====================

		/**
		 * 渲染概览统计卡片
		 */
		const renderOverviewCards = () => (
			<NGrid cols={isMobile.value ? '2' : '1 s:2 m:4'} xGap={16} yGap={16} responsive="screen">
				{overviewCards.value.map((card) => {
					const IconComponent =
						{
							ShoppingCart,
							Clock,
							CheckCircle,
							XCircle,
						}[card.icon] || ShoppingCart
					return (
						<NGridItem key={card.title}>
							<div class="transition-shadow">
								<NCard bordered={false} class={isMobile.value ? 'card-shadow overview-card' : 'card-shadow'}>
									<div class="flex items-center justify-between">
										<div class="flex-1">
											<div class="text-sm text-gray-500 mb-1">{card.title}</div>
											<div class="text-2xl font-bold" style={{ color: card.color }}>
												{card.value}
											</div>
										</div>
										<div
											class="w-12 h-12 rounded-lg flex items-center justify-center"
											style={{ backgroundColor: card.bgColor }}
										>
											<NIcon size={isMobile.value ? 20 : 24} style={{ color: card.color }}>
												<IconComponent />
											</NIcon>
										</div>
									</div>
								</NCard>
							</div>
						</NGridItem>
					)
				})}
			</NGrid>
		)

		/**
		 * 渲染筛选搜索区域
		 */
		const renderFilterSection = () => (
			<NCard bordered={false} class="card-shadow">
				{isMobile.value ? (
					<NFlex vertical class="w-full" size="medium">
						<NFlex justify="space-between" align="end">
							{/* <div class="text-lg font-semibold text-gray-800">订单管理</div> */}
							<NButton onClick={toggleSearchForm} class="search-toggle-btn">
								{showSearchForm.value ? (
									<>
										<NIcon size="18">
											<CloseOutline />
										</NIcon>
										<span>关闭</span>
									</>
								) : (
									<>
										<NIcon size="18">
											<SearchOutline />
										</NIcon>
										<span>搜索</span>
									</>
								)}
							</NButton>
						</NFlex>
						{showSearchForm.value && (
							<>
								<NDivider class="!my-2" dashed />
								<div class="mobile-search-form">
									<FilterForm inline={false} />
								</div>
							</>
						)}
					</NFlex>
				) : (
					<NFlex justify="space-between" align="center" class="w-full">
						<NFlex class="w-full !flex-row !flex-wrap justify-end" size="medium">
							<FilterForm class="flex-1 justify-end" inline={true} />
						</NFlex>
					</NFlex>
				)}
			</NCard>
		)

		/**
		 * 渲染加载骨架屏
		 */
		const renderSkeleton = () => (
			<div class="space-y-6">
				<NGrid cols={4} xGap={16}>
					{Array.from({ length: 4 }).map((_, index) => (
						<NGridItem key={index}>
							<NCard bordered={false}>
								<NSkeleton height="80px" />
							</NCard>
						</NGridItem>
					))}
				</NGrid>
				<NCard bordered={false}>
					<NSkeleton height="400px" />
				</NCard>
			</div>
		)

		/**
		 * 渲染订单列表
		 */
		const renderOrderList = () => (
			<>
				{isMobile.value ? (
					<NFlex vertical class="crad-list-mobile">
						<OrderCardList data={data.value?.list || []} loading={loading.value} class="mb-4" />
						<NFlex justify="center">
							<OrderTablePage pageSlot={4} />
						</NFlex>
					</NFlex>
				) : (
					<NCard bordered={false} class="card-shadow">
						<OrderTable loading={loading.value} class="mb-4" />
						<NFlex justify="end">
							<OrderTablePage />
						</NFlex>
					</NCard>
				)}
			</>
		)

		// ==================== 主渲染 ====================
		return () => (
			<div class="flex flex-col gap-[16px]">
				{/* 筛选搜索区域 */}
				{renderFilterSection()}

				{/* 概览统计卡片 */}
				{renderOverviewCards()}

				{/* 订单列表 */}
				{renderOrderList()}
			</div>
		)
	},
})
