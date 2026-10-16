import { NInput, NButton, NSpace, NSelect } from 'naive-ui'
import { $t } from '@/locales'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { ModuleRouterView as RouterView } from '@/modules'
import { Search } from '@vicons/carbon'
import { useController } from './useController'
import { useRouter } from 'vue-router'

import BaseComponent from '@components/BaseLayout'
import EmptyState from '@components/TableEmptyState'

/**
 * 工作流页面组件
 */
export default defineComponent({
	name: 'WorkflowManager',
	setup() {
		const {
			TableComponent,
			PageComponent,
			SearchComponent,
			isDetectionAddWorkflow,
			isDetectionOpenCAManage,
			isDetectionOpenAddCAForm,
			handleAddWorkflow,
			handleOpenCAManage,
			hasChildRoutes,
			fetch,
			checkedRowKeysRef,
			batchActionRef,
			handleCheck,
			handleBatchAction,
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
			isDetectionOpenCAManage()
			isDetectionOpenAddCAForm()
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
									<NSpace>
										<NButton type="primary" size="large" class="px-5" onClick={handleAddWorkflow}>
											{$t('t_0_1747047213730')}
										</NButton>
										<NButton type="default" size="large" class="px-5" onClick={handleOpenCAManage}>
											<span class="px-2">{$t('t_0_1747903670020')}</span>
										</NButton>
									</NSpace>
								),
								headerRight: () => <SearchComponent placeholder={$t('t_1_1745227838776')} />,
								content: () => (
									<div class="rounded-lg ">
										<TableComponent
											checkedRowKeys={checkedRowKeysRef.value}
											onUpdateCheckedRowKeys={handleCheck}
											rowKey={(row: any) => row.id.toString()}
											size="medium"
											v-slots={{
												empty: () => (
													<EmptyState addButtonText={$t('t_0_1747047213730')} onAddClick={handleAddWorkflow} />
												),
											}}
										/>
									</div>
								),
								footerLeft: () => (
									<div class="mt-4 flex items-center gap-3">
										<NSelect
											v-model:value={batchActionRef.value}
											options={[{ label: '删除', value: 'delete' }]}
											style={{ width: '120px' }}
											disabled={checkedRowKeysRef.value.length === 0}
											size="small"
										/>
										<NButton size="small" type="primary" disabled={checkedRowKeysRef.value.length === 0} onClick={handleBatchAction}>
											批量操作
										</NButton>
										<span class="text-gray-500">已选中 {checkedRowKeysRef.value.length} 项</span>
									</div>
								),
								footerRight: () => (
									<div class="mt-4 flex justify-end">
										<PageComponent />
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
