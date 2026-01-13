import { defineComponent, ref } from 'vue'
import { NFlex, NButton, NDivider, NIcon, NAlert } from 'naive-ui'
import { CloseOutline, SearchOutline } from '@vicons/ionicons5'
import { useTransferOutController } from './useController'
import { useApp } from '@/components/layout/useStore'

export default defineComponent({
	name: 'DomainTransferOutView',
	setup() {
		const { loading, TableComponent, PageComponent, FilterForm, TransferOutCardList, tableData, openTransferOutDialog } =
			useTransferOutController()
		const { isMobile } = useApp()

		// 移动端搜索表单显示状态
		const showSearchForm = ref(false)
		const toggleSearchForm = () => {
			showSearchForm.value = !showSearchForm.value
		}

		const renderFilterSection = () => (
			<>
				{isMobile.value ? (
					<NFlex vertical class="w-full" size="medium">
						<NFlex justify="space-between" align="center">
							<NButton type="primary" onClick={() => openTransferOutDialog()}>
								域名转出
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
							<div>
								<NButton type="primary" onClick={() => openTransferOutDialog()}>
									域名转出
								</NButton>
							</div>
							<FilterForm class="flex-1 justify-end" inline={true} />
						</NFlex>
					</NFlex>
				)}
			</>
		)

		const renderList = () => (
			<>
				{isMobile.value ? (
					<NFlex vertical>
						<>
							<TransferOutCardList data={tableData.value?.list || []} loading={loading.value} />
							<NFlex justify="center">
								<PageComponent />
							</NFlex>
						</>
					</NFlex>
				) : (
					<>
						<TableComponent max-height={`calc(100vh - 560px)`} class="mb-4" />
						<NFlex justify="end">
							<PageComponent />
						</NFlex>
					</>
				)}
			</>
		)

		return () => (
			<div class="flex flex-col justify-between">
				<div class="flex flex-col gap-[16px]">
					{renderFilterSection()}
					{renderList()}
				</div>
			</div>
		)
	},
})