import { NButton, NInput } from 'naive-ui'
import { PlusOutlined } from '@vicons/antd'
import { Search } from '@vicons/carbon'
import { $t } from '@locales/index'
import { useThemeCssVar } from '@baota/naive-ui/theme'

import { useController } from './useController'

import BaseComponent from '@components/baseComponent'
import EmptyState from '@components/emptyState'

/**
 * 监控管理组件
 */
export default defineComponent({
	name: 'MonitorManage',
	setup() {
		const { MonitorTable, MonitorTablePage, param, fetch, data, openAddForm, isDetectionAddMonitor } = useController()
		const cssVar = useThemeCssVar(['contentPadding', 'borderColor', 'headerHeight', 'iconColorHover'])
		onMounted(() => {
			fetch()
			isDetectionAddMonitor()
		})
		return () => (
			<div class="h-full flex flex-col" style={cssVar.value}>
				<div class="mx-auto max-w-[1600px] w-full p-6">
					<BaseComponent
						v-slots={{
							headerLeft: () => (
								<NButton type="primary" size="large" class="px-5" onClick={openAddForm}>
									<PlusOutlined class="text-[var(--text-color-3)] w-[1.6rem]" />
									<span class="px-2">{$t('t_11_1745289354516')}</span>
								</NButton>
							),
							headerRight: () => (
								<NInput
									v-model:value={param.value.search}
									onKeydown={(e: KeyboardEvent) => {
										if (e.key === 'Enter') fetch()
									}}
									onClear={() => fetch()}
									placeholder={$t('t_12_1745289356974')}
									clearable
									size="large"
									class="min-w-[300px]"
									v-slots={{
										suffix: () => (
											<div class="flex items-center" onClick={fetch}>
												<Search class="text-[var(--text-color-3)] w-[1.6rem] cursor-pointer font-bold" />
											</div>
										),
									}}
								></NInput>
							),
							content: () => (
								<div class="rounded-lg">
									<MonitorTable size="medium">
										{{
											empty: () => <EmptyState addButtonText={$t('t_11_1745289354516')} onAddClick={openAddForm} />,
										}}
									</MonitorTable>
								</div>
							),
							footerRight: () => (
								<div class="mt-4 flex justify-end">
									<MonitorTablePage
										v-slots={{
											prefix: () => (
												<span>
													{$t('t_15_1745227839354')} {data.value.total} {$t('t_16_1745227838930')}
												</span>
											),
										}}
									/>
								</div>
							),
						}}
					></BaseComponent>
				</div>
			</div>
		)
	},
})
