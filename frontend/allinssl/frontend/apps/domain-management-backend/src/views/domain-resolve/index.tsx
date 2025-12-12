/**
 * 域名解析页面
 * 职责：渲染域名解析界面，展示筛选、列表与分页
 */

import { defineComponent, onMounted, ref } from 'vue'
import { NCard, NFlex, NButton, NDivider, NIcon } from 'naive-ui'
import { CloseOutline, SearchOutline } from '@vicons/ionicons5'
import { useRoute } from 'vue-router'
import { useController } from './useController'

/**
 * 域名解析页面组件
 */
export default defineComponent({
	name: 'DomainResolve',
	setup() {
		const route = useRoute()
		const { loading, isMobile, ResolveTable, ResolveTablePage, ResolveCardList, tableData, FilterForm, formFetchSearch, handleShowAddDomainModal, domainName } =
			useController()

		// 移动端搜索表单显示状态
		const showSearchForm = ref(false)

		// 判断是否为子路由（详情页）
		const isDetailPage = () => route.matched.some(record => record.name === 'DomainResolveDetail')

		// 切换搜索表单显示状态
		const toggleSearchForm = () => {
			showSearchForm.value = !showSearchForm.value
		}

		// 渲染筛选搜索区域
		const renderFilterSection = () => (
			<NCard class="card-shadow" bordered={false}>
				{isMobile.value ? (
					<NFlex vertical class="w-full" size="medium">
						<NFlex justify="space-between" align="center">
							<NButton type="primary" onClick={handleShowAddDomainModal}>
								添加域名
							</NButton>
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
						<NFlex class="w-full !flex-row !flex-wrap" size="medium">
							<NButton type="primary" onClick={handleShowAddDomainModal}>
								添加域名
							</NButton>
							<FilterForm class="flex-1 justify-end" inline={true} />
						</NFlex>
					</NFlex>
				)}
			</NCard>
		)

		// 渲染解析记录列表
		const renderResolveList = () => (
			<>
				{isMobile.value ? (
					<NFlex vertical>
						<ResolveCardList data={tableData.value?.list || []} loading={loading.value} class="mb-4" />
						<NFlex justify="center">
							<ResolveTablePage />
						</NFlex>
					</NFlex>
				) : (
					<NCard class="card-shadow" bordered={false}>
						<ResolveTable loading={loading.value} class="mb-4" />
						<NFlex justify="end">
							<ResolveTablePage />
						</NFlex>
					</NCard>
				)}
			</>
		)

		onMounted(() => {
			// 只在列表页面时执行数据加载
			if (!isDetailPage()) {
				formFetchSearch()
			}
		})

		// 主渲染
		return () => (
			<div class="flex flex-col gap-[16px]">
				{isDetailPage() ? (
					// 显示子路由内容（详情页）
					<router-view />
				) : (
					// 显示列表页内容
					<>
						{renderFilterSection()}
						{renderResolveList()}
					</>
				)}
			</div>
		)
	},
})