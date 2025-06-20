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
		const { TableComponent, PageComponent, SearchComponent, openAddForm } = useController()
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
							headerRight: () => <SearchComponent placeholder={$t('t_0_1745289808449')} />,
							content: () => (
								<div class="rounded-lg">
									<TableComponent
										size="medium"
										scroll-x="1560"
										v-slots={{
											empty: () => <EmptyState addButtonText={$t('t_0_1745289355714')} onAddClick={openAddForm} />,
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
					/>
				</div>
			</div>
		)
	},
})
