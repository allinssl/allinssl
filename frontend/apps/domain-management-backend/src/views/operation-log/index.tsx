import { defineComponent, onMounted } from 'vue'
import { NCard, NFlex, NPageHeader, NSpin } from 'naive-ui'
import { useController } from './useController'

export default defineComponent({
	name: 'OperationLog',
	props: {},
	setup() {
		const {
			// 表格相关
			OperateLogTable,
			OperateLogTablePage,
			OperateLogCardList,
			loading,
			tableData,

			// 表单相关
			FilterForm,

			// 状态
			isMobile,
		} = useController()

		return () => (
			<div class="flex flex-col gap-[16px]">
				{/* 筛选表单 */}
				<NCard bordered={false} class="card-shadow">
					<NFlex class="w-full !flex-row !flex-wrap" size="medium">
						<FilterForm class="flex-1 justify-end" inline={true} />
					</NFlex>
				</NCard>

				{/* 数据展示区域 */}
				<NCard bordered={false} class="card-shadow">
					<NSpin show={loading.value}>
						{isMobile.value ? (
							/* 移动端卡片列表 */
							<NFlex vertical size="medium">
								<OperateLogCardList data={tableData.value?.list || []} loading={loading.value} />
								<NFlex justify="center">
										<OperateLogTablePage />
								</NFlex>
							</NFlex>
						) : (
							/* 桌面端表格 */
							<NFlex vertical size="medium">
									<OperateLogTable />
									<NFlex justify="end">
										<OperateLogTablePage />
									</NFlex>
							</NFlex>
						)}
					</NSpin>
				</NCard>
			</div>
		)
	},
})
