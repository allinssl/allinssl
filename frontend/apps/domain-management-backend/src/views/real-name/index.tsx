/**
 * 实名模板管理页面
 * 负责UI渲染和用户交互
 */

import { defineComponent, onMounted } from 'vue'
import { NCard, NButton, NFlex, NDivider } from 'naive-ui'
import { useController } from './useController'

export default defineComponent({
	name: 'RealNamePage',
	setup() {
		const {
			// 状态
			loading,
			isMobile,

			// 表格组件和数据
			fetchTable,
			TemplateTable,
			TemplateTablePage,
			tableData,

			// 移动端卡片
			TemplateCardList,

			// 事件处理
			handleAddTemplate,

			// 表单弹窗相关方法已通过useModal实现
		} = useController()

		// 初始化时获取模板列表
		onMounted(() => {
			fetchTable()
		})

		/**
		 * 渲染操作按钮和搜索框
		 */
		const renderActionSection = () => (
			<NCard class="card-shadow" bordered={false}>
				{isMobile.value ? (
					<NFlex vertical class="w-full !flex-nowrap !flex-row" justify="start" size="medium">
						<NButton type="primary" onClick={handleAddTemplate}>
							创建模板
						</NButton>
					</NFlex>
				) : (
					<NFlex class="w-full" justify="space-between">
						<NButton type="primary" onClick={handleAddTemplate}>
							创建实名模板
						</NButton>
					</NFlex>
				)}
			</NCard>
		)

		/**
		 * 渲染表格区域
		 */
		const renderTableSection = () => (
			<>
				{isMobile.value ? (
					<NFlex vertical>
						<TemplateCardList data={tableData.value?.list || []} loading={loading.value} class="mb-4" />
						<NFlex justify="center">
							<TemplateTablePage />
						</NFlex>
					</NFlex>
				) : (
					<NCard class="card-shadow" bordered={false}>
						<TemplateTable class="mb-4" />
						<NFlex justify="end">
							<TemplateTablePage />
						</NFlex>
					</NCard>
				)}
			</>
		)

		// -------------------- 渲染函数 --------------------

		return () => (
			<div class="flex flex-col gap-[16px]">
				{/* 操作区域 */}
				{renderActionSection()}

				{/* 主要内容区域 */}
				{renderTableSection()}
			</div>
		)
	},
})
