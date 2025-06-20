import { defineComponent, onMounted } from 'vue'
import { NButton, NInput } from 'naive-ui'
import { Search } from '@vicons/carbon'

import { $t } from '@locales/index'
import { useThemeCssVar } from '@baota/naive-ui/theme'

import { useController } from './useController'

import BaseComponent from '@components/BaseLayout'
import EmptyState from '@components/TableEmptyState'

/**
 * 监控管理组件
 * @description 提供证书监控的管理界面，包括列表展示、搜索、添加、编辑等功能
 */
export default defineComponent({
	name: 'MonitorManage',
	setup() {
		// 使用控制器获取数据和方法
		const { TableComponent, PageComponent, SearchComponent, fetch, openAddForm, isDetectionAddMonitor } =
			useController()

		// 获取主题CSS变量
		const cssVar = useThemeCssVar(['contentPadding', 'borderColor', 'headerHeight', 'iconColorHover'])

		// 组件挂载时初始化数据
		onMounted(() => {
			// 获取监控列表数据
			fetch()
			// 检测是否需要自动打开添加表单（从其他页面跳转而来）
			isDetectionAddMonitor()
		})

		// 返回渲染函数
		return () => (
			<div class="h-full flex flex-col" style={cssVar.value}>
				<div class="mx-auto max-w-[1600px] w-full p-6">
					<BaseComponent
						v-slots={{
							// 头部左侧区域 - 添加按钮
							headerLeft: () => (
								<NButton type="primary" size="large" class="px-5" onClick={openAddForm}>
									{$t('t_11_1745289354516')}
								</NButton>
							),
							// 头部右侧区域 - 搜索框
							headerRight: () => <SearchComponent placeholder={$t('t_12_1745289356974')} />,
							// 内容区域 - 监控表格
							content: () => (
								<div class="rounded-lg">
									<TableComponent
										size="medium"
										scroll-x="1800"
										v-slots={{
											empty: () => <EmptyState addButtonText={$t('t_11_1745289354516')} onAddClick={openAddForm} />,
										}}
									/>
								</div>
							),
							// 底部右侧区域 - 分页组件
							footerRight: () => (
								<div class="mt-4 flex justify-end">
									<PageComponent />
								</div>
							),
						}}
					></BaseComponent>
				</div>
			</div>
		)
	},
})
