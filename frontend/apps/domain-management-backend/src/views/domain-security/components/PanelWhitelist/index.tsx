/**
 * 面板IP白名单组件
 * 职责：渲染IP白名单管理界面，展示IP白名单管理功能
 */

import { defineComponent, onMounted } from 'vue'
import { NCard, NFlex, NButton } from 'naive-ui'
import { useController } from './useController'

/**
 * 面板IP白名单组件
 */
export default defineComponent({
	name: 'PanelWhitelist',
	setup() {
		const {
			loading,
			isMobile,
			PanelWhitelistTable,
			PanelWhitelistTablePage,
			PanelWhitelistCardList,
			tableData,
			handleCreate,
			fetchPanelWhitelists,
		} = useController()


		// 渲染操作区域
		const renderActionSection = () => (
			<NFlex justify="start" align="center" class="w-full">
				<NButton type="primary" onClick={handleCreate}>
					创建IP白名单
				</NButton>
			</NFlex>
		)

		// 渲染IP白名单列表
		const renderPanelWhitelistList = () => (
			<>
				{isMobile.value ? (
					<NFlex vertical>
						<PanelWhitelistCardList data={tableData.value?.list || []} loading={loading.value} class="mb-4" />
						<NFlex justify="center">
							<PanelWhitelistTablePage />
						</NFlex>
					</NFlex>
				) : (
					<>
						<PanelWhitelistTable loading={loading.value} class="mb-4" />
						<NFlex justify="end">
							<PanelWhitelistTablePage />
						</NFlex>
					</>
				)}
			</>
		)

		// 初始化数据
		onMounted(() => {
			fetchPanelWhitelists()
		})

		// 主渲染
		return () => (
			<div class="flex flex-col gap-[16px]">
				{renderActionSection()}
				{renderPanelWhitelistList()}
			</div>
		)
	},
})
