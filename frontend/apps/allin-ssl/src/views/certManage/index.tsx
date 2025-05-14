import { NInput, NButton } from 'naive-ui'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { PlusOutlined } from '@vicons/antd'
import { Search } from '@vicons/carbon'
import { $t } from '@locales/index'
import { useController } from './useController'

import BaseComponent from '@components/baseComponent'
import EmptyState from '@components/emptyState'

/**
 * 证书管理组件
 */
export default defineComponent({
	name: 'CertManage',
	setup() {
		const { CertTable, CertTablePage, fetch, data, param, openUploadModal } = useController()
		const cssVar = useThemeCssVar(['contentPadding', 'borderColor', 'headerHeight', 'iconColorHover'])
		// 挂载时请求数据
		onMounted(() => fetch())

		return () => (
			<div class="h-full flex flex-col" style={cssVar.value}>
				<div class="mx-auto max-w-[1600px] w-full p-6">
					<BaseComponent
						v-slots={{
							headerLeft: () => (
								<NButton type="primary" size="large" class="px-5" onClick={openUploadModal}>
									<PlusOutlined class="text-[var(--text-color-3)] w-[1.6rem]" />
									<span class="px-2">{$t('t_13_1745227838275')}</span>
								</NButton>
							),
							headerRight: () => (
								<NInput
									v-model:value={param.value.search}
									onKeydown={(e: KeyboardEvent) => {
										if (e.key === 'Enter') fetch()
									}}
									onClear={() => useThrottleFn(fetch, 100)}
									placeholder={$t('t_14_1745227840904')}
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
									<CertTable size="medium">
										{{
											empty: () => <EmptyState addButtonText={$t('t_1_1747047213009')} onAddClick={openUploadModal} />,
										}}
									</CertTable>
								</div>
							),
							footerRight: () => (
								<div class="mt-4 flex justify-end">
									<CertTablePage
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
