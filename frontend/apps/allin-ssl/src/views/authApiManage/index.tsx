import { NInput, NButton } from 'naive-ui'
import { PlusOutlined } from '@vicons/antd'
import { Search } from '@vicons/carbon'
import { $t } from '@locales/index'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { useController } from './useController'

import EmptyState from '@components/emptyState/index'
import BaseComponent from '@components/baseComponent'

/**
 * 授权API管理页面组件
 */
export default defineComponent({
	name: 'AuthApiManage',
	setup() {
		const { ApiTable, ApiTablePage, param, fetch, data, openAddForm } = useController()
		const cssVar = useThemeCssVar(['contentPadding', 'borderColor', 'headerHeight', 'iconColorHover'])

		return () => (
			<div class="h-full flex flex-col" style={cssVar.value}>
				<div class="mx-auto max-w-[1600px] w-full p-6">
					<BaseComponent
						v-slots={{
							headerLeft: () => (
								<NButton type="primary" size="large" class="px-5" onClick={openAddForm}>
									<PlusOutlined class="text-[var(--text-color-3)] w-[1.6rem]" />
									<span class="px-2">{$t('t_0_1745289355714')}</span>
								</NButton>
							),
							headerRight: () => (
								<NInput
									v-model:value={param.value.search}
									onKeydown={(e: KeyboardEvent) => {
										if (e.key === 'Enter') fetch()
									}}
									onClear={() => useTimeoutFn(() => fetch(), 100)}
									placeholder={$t('t_0_1745289808449')}
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
									<ApiTable
										size="medium"
										v-slots={{
											empty: () => <EmptyState addButtonText={$t('t_0_1745289355714')} onAddClick={openAddForm} />,
										}}
									/>
								</div>
							),
							footerRight: () => (
								<div class="mt-4 flex justify-end">
									<ApiTablePage
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
