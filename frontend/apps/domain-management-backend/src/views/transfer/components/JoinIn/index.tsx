import { defineComponent, ref } from 'vue'
import { NCard, NFlex, NButton, NDivider, NIcon, NAlert } from 'naive-ui'
import { CloseOutline, SearchOutline } from '@vicons/ionicons5'
import { useController } from './useController'
import { useApp } from '@/components/layout/useStore'

export default defineComponent({
	name: 'DomainTransferView',
	setup() {
		const { loading, TableComponent, PageComponent, FilterForm, TransferCardList, tableData, openTransferDialog } =
			useController()
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
							<NButton type="primary" onClick={() => openTransferDialog()}>
								域名转入
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
								<NButton type="primary" onClick={() => openTransferDialog()}>
									域名转入
								</NButton>
								<a
									class="ml-4 text-[#20a53a] decoration-none hover:text-[#20a53a]-800 text-sm cursor-pointer"
									href="https://docs.bt.cn/domain/user-guide/domain-transfer-in"
									target="_blank"
									rel="noopener noreferrer"
								>
									帮助文档
								</a>
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
							<TransferCardList data={tableData.value?.list || []} loading={loading.value} />
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
			<div class="flex flex-col justify-between min-h-[calc(100vh-160px)]">
				<div class="flex flex-col gap-[16px] p-4">
					{renderFilterSection()}
					{renderList()}
				</div>
				<NAlert title="重要提示" type="info" class="mt-4">
					<div class="mt-2">
						<ul class="list-disc text-sm text-gray-700 leading-relaxed">
							<li>
								如域名有效期已达10年(最长期限)，则转入时仍需扣除费用但年限不增加。域名续费不足45天时不建议转入，否则可能导致年限减少。
							</li>
							<li>根据ICANN 相关规定，域名注册、转入后的60天内将不允许转移注册商。</li>
							<li>
								域名转入时，注册局需要重新对转入的域名进行前缀的合法性命名审核，如果合法命名审核无法通过，域名将无法转入。
							</li>
							<li>
								域名转入时必须选择已实名认证的域名信息模板。域名转入一般需要 3~7个工作日，具体取决于注册局审核时间。
							</li>
						</ul>
					</div>
				</NAlert>
			</div>
		)
	},
})
