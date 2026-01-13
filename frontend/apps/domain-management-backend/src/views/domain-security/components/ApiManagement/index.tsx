/**
 * API管理组件
 * 职责：渲染API密钥管理界面，展示API密钥管理功能
 */

import { defineComponent, onMounted, ref } from 'vue'
import { NCard, NFlex, NButton, NDivider, NIcon } from 'naive-ui'
import { CloseOutline, SearchOutline } from '@vicons/ionicons5'
import { useController } from './useController'

/**
 * API管理组件
 */
export default defineComponent({
	name: 'ApiManagement',
	setup() {
		const {
			loading,
			isMobile,
			ApiKeyTable,
			ApiKeyTablePage,
			ApiKeyCardList,
			tableData,
			FilterForm,
			formFetchSearch,
			handleCreate,
		} = useController()

		// 移动端搜索表单显示状态
		const showSearchForm = ref(false)

		// 切换搜索表单显示状态
		const toggleSearchForm = () => {
			showSearchForm.value = !showSearchForm.value
		}

		// 渲染筛选搜索区域
		const renderFilterSection = () => (
			<>
				{isMobile.value ? (
					<NFlex vertical class="w-full" size="medium">
						<NFlex justify="space-between" align="center">
							<NButton type="primary" onClick={handleCreate}>
								创建API密钥
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
							<NButton type="primary" onClick={handleCreate}>
								创建API密钥
							</NButton>
							<FilterForm class="flex-1 justify-end" inline={true} />
						</NFlex>
					</NFlex>
				)}
			</>
		)

		// 渲染API密钥列表
		const renderApiKeyList = () => (
			<>
				{isMobile.value ? (
					<NFlex vertical>
						<ApiKeyCardList data={tableData.value?.list || []} loading={loading.value} class="mb-4" />
						<NFlex justify="center">
							<ApiKeyTablePage />
						</NFlex>
					</NFlex>
				) : (
					<>
						<ApiKeyTable loading={loading.value} class="mb-4" />
						<NFlex justify="end">
							<ApiKeyTablePage />
						</NFlex>
					</>
				)}
			</>
		)

		onMounted(() => formFetchSearch())

		// 主渲染
		return () => (
			<div class="flex flex-col gap-[16px]">
				{renderFilterSection()}
				{renderApiKeyList()}
			</div>
		)
	},
})