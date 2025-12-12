import { NInput, NButton, NSpace } from 'naive-ui'
import { $t } from '@/locales'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { RouterView } from '@baota/router'
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
											size="medium"
											v-slots={{
												empty: () => (
													<EmptyState addButtonText={$t('t_0_1747047213730')} onAddClick={handleAddWorkflow} />
												),
											}}
										/>
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
