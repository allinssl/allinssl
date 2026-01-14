import { NInput, NButton, NSelect } from 'naive-ui'
import { useTheme, useThemeCssVar } from '@baota/naive-ui/theme'
import { Search } from '@vicons/carbon'
import { $t } from '@locales/index'
import { useController } from './useController'

import BaseComponent from '@components/BaseLayout'
import EmptyState from '@components/TableEmptyState'

const batchActionOptions = [
	{ label: '删除', value: 'delete' },
]

/**
 * 证书管理组件
 */
export default defineComponent({
	name: 'CertManage',
	setup() {
		const { TableComponent, PageComponent, SearchComponent, openUploadModal, getRowClassName, checkedRowKeysRef, handleCheck, batchActionRef, handleBatchAction, statusFilterRef } = useController()

		const cssVar = useThemeCssVar(['contentPadding', 'borderColor', 'headerHeight', 'iconColorHover'])

		const handleFiltersChange = (filters: any, column: any) => {
			if (column.key === 'end_day') {
				statusFilterRef.value = filters.end_day || null
			}
		}

		return () => (
			<div class="h-full flex flex-col" style={cssVar.value}>
				<div class="mx-auto max-w-[1600px] w-full p-6">
					<BaseComponent
						v-slots={{
							headerLeft: () => (
								<NButton class="gradient-primary-btn px-5" type="primary" size="large" onClick={openUploadModal}>
									{$t('t_13_1745227838275')}
								</NButton>
							),
							headerRight: () => <SearchComponent class="header-search" placeholder={$t('t_0_1763542847861')} />,
							content: () => (
								<div class="rounded-lg">
									<TableComponent
										checkedRowKeys={checkedRowKeysRef.value}
										onUpdateCheckedRowKeys={handleCheck}
										rowClassName={getRowClassName}
										rowKey={(row: any) => row.id.toString()}
										onUpdateFilters={handleFiltersChange}
										v-slots={{
											empty: () => <EmptyState addButtonText={$t('t_1_1747047213009')} onAddClick={openUploadModal} />,
										}}
									/>
								</div>
							),
							footerRight: () => (
								<div class="mt-4 flex justify-end">
									<PageComponent />
								</div>
							),
							footerLeft: () => (
								<div class="mt-4 flex items-center gap-3">
									<NSelect
										v-model:value={batchActionRef.value}
										options={batchActionOptions}
										style={{ width: '120px' }}
										disabled={checkedRowKeysRef.value.length === 0}
										size="small"
									/>
									<NButton 
										size="small"
										disabled={checkedRowKeysRef.value.length === 0} type="primary" onClick={handleBatchAction}>
										批量操作
									</NButton>
									<span class="text-gray-500">已选中 {checkedRowKeysRef.value.length} 项</span>
								</div>
							),
						}}
					></BaseComponent>
				</div>
			</div>
		)
	},
})
