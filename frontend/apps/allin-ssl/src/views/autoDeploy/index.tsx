import { NInput, NButton } from 'naive-ui'
import { $t } from '@/locales'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { RouterView } from '@baota/router'
import { PlusOutlined } from '@vicons/antd'
import { Search } from '@vicons/carbon'
import { useController } from './useController'
import { useRouter } from 'vue-router'

import BaseComponent from '@components/baseComponent'
import EmptyState from '@components/emptyState/index'

/**
 * 工作流页面组件
 */
export default defineComponent({
	name: 'WorkflowManager',
	setup() {
		const {
			WorkflowTable,
			WorkflowTablePage,
			isDetectionAddWorkflow,
			handleAddWorkflow,
			hasChildRoutes,
			param,
			fetch,
			data,
		} = useController()
		const router = useRouter()
		// 获取主题变量
		const cssVar = useThemeCssVar(['contentPadding', 'borderColor', 'headerHeight', 'iconColorHover'])

		watch(
			() => router.currentRoute.value.path,
			(val) => {
				if (val === '/auto-deploy') fetch()
			},
		)

		// 挂载时获取数据
		onMounted(() => {
			isDetectionAddWorkflow()
			fetch()
		})

		return () => (
			<div class="h-full flex flex-col" style={cssVar.value}>
				<div class="mx-auto max-w-[1600px] w-full p-6">
					{hasChildRoutes.value ? (
						<RouterView />
					) : (
						<BaseComponent
							v-slots={{
								headerLeft: () => (
									<NButton type="primary" size="large" class="px-5" onClick={handleAddWorkflow}>
										<PlusOutlined class="text-[var(--text-color-3)] w-[1.6rem]" />
										<span class="px-2">{$t('t_0_1747047213730')}</span>
									</NButton>
								),
								headerRight: () => (
									<NInput
										v-model:value={param.value.search}
										onKeydown={(e: KeyboardEvent) => {
											if (e.key === 'Enter') fetch()
										}}
										onClear={() => useTimeoutFn(fetch, 100)}
										placeholder={$t('t_1_1745227838776')}
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
									<div class="rounded-lg ">
										<WorkflowTable size="medium">
											{{
												empty: () => (
													<EmptyState addButtonText={$t('t_0_1747047213730')} onAddClick={handleAddWorkflow} />
												),
											}}
										</WorkflowTable>
									</div>
								),
								footerRight: () => (
									<div class="mt-4 flex justify-end">
										<WorkflowTablePage
											v-slots={{
												prefix: () => <span>{$t('t_0_1746773350551', [data.value.total])}</span>,
											}}
										/>
									</div>
								),
							}}
						></BaseComponent>
					)}
				</div>
			</div>
		)
	},
})
