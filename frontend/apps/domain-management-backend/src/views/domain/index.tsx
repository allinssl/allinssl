/**
 * 域名管理页面
 * 职责：渲染域名管理界面，展示概览、筛选、列表与分页
 */

import { defineComponent, onMounted, ref } from 'vue'
import { NCard, NFlex, NButton, NDivider, NIcon } from 'naive-ui'
import { CloseOutline, SearchOutline } from '@vicons/ionicons5'
import { useController } from './useController'

/**
 * 域名管理页面组件
 */
export default defineComponent({
	name: 'DomainManage',
	setup() {
		const { loading, isMobile, DomainTable, DomainTablePage, DomainCardList, tableData, FilterForm, formFetchSearch } =
			useController()

		// 移动端搜索表单显示状态
		const showSearchForm = ref(false)

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
							<NButton
								type="primary"
								onClick={() => window.open('https://www.bt.cn/new/domain-register.html', '_blank')}
							>
								注册域名
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
							<NButton
								type="primary"
								onClick={() => window.open('https://www.bt.cn/new/domain-register.html', '_blank')}
							>
								注册域名
							</NButton>
							<FilterForm class="flex-1 justify-end" inline={true} />
						</NFlex>
					</NFlex>
				)}
			</NCard>
		)

		// 渲染域名列表
		const renderDomainList = () => (
			<>
				{isMobile.value ? (
					<NFlex vertical>
						<DomainCardList data={tableData.value?.list || []} loading={loading.value} class="mb-4" />
						<NFlex justify="center">
							<DomainTablePage />
						</NFlex>
					</NFlex>
				) : (
					<NCard class="card-shadow" bordered={false}>
						<DomainTable loading={loading.value} class="mb-4" />
						<NFlex justify="end">
							<DomainTablePage />
						</NFlex>
					</NCard>
				)}
			</>
		)

		// 主渲染
		return () => (
			<div class="flex flex-col gap-[16px]">
				{renderFilterSection()}
				{renderDomainList()}
			</div>
		)
	},
})
