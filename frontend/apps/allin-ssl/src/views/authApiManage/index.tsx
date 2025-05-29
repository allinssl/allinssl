import { defineComponent } from 'vue'
import { NInput, NButton } from 'naive-ui'
import { Search } from '@vicons/carbon'
import { $t } from '@locales/index'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { useController } from './useController'

import EmptyState from '@components/TableEmptyState'
import BaseComponent from '@components/BaseLayout'

/**
 * 授权API管理页面组件
 * @description 展示授权API列表、提供添加、编辑、删除等功能的主页面组件
 */
export default defineComponent({
	name: 'AuthApiManage',
	setup() {
		const { ApiTable, ApiTablePage, param, fetch, total, openAddForm } = useController()
		const cssVar = useThemeCssVar(['contentPadding', 'borderColor', 'headerHeight', 'iconColorHover'])

		return () => (
			<div class="h-full flex flex-col" style={cssVar.value}>
				<div class="mx-auto max-w-[1600px] w-full p-6">
					<BaseComponent
						v-slots={{
							headerLeft: () => (
								<NButton type="primary" size="large" class="px-5" onClick={openAddForm}>
									{$t('t_0_1745289355714')}
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
											<div class="flex items-center cursor-pointer" onClick={fetch}>
												<Search class="text-[var(--text-color-3)] w-[1.6rem] font-bold" />
											</div>
										),
									}}
								/>
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
													{$t('t_15_1745227839354')} {total.value} {$t('t_16_1745227838930')}
												</span>
											),
										}}
									/>
								</div>
							),
						}}
					/>
				</div>
			</div>
		)
	},
})
