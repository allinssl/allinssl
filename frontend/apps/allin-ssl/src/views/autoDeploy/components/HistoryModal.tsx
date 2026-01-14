import { useHistoryController } from '@autoDeploy/useController'
import BaseComponent from '@components/BaseLayout'
import { $t } from '@locales/index'
import { NButton, NSelect } from 'naive-ui'

const batchActionOptions = [
	{ label: '删除', value: 'delete' },
]

/**
 * 工作流执行历史模态框组件
 */
export default defineComponent({
	name: 'HistoryModal',
	props: {
		id: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { TableComponent, PageComponent, fetch, checkedRowKeysRef, handleCheck, batchActionRef, handleBatchAction } = useHistoryController(props.id)
		onMounted(() => {
			fetch()
		})
		return () => (
			<div class="flex w-full">
				<BaseComponent
					v-slots={{
						header: () => (
							<div class="flex items-center justify-between mb-[1.6rem]">
								<NButton class="gradient-default-btn" type="default" onClick={() => fetch()}>
									{$t('t_9_1746667589516')}
								</NButton>
							</div>
						),
						content: () => <TableComponent
							checkedRowKeys={checkedRowKeysRef.value}
							onUpdateCheckedRowKeys={handleCheck}
							rowKey={(row: any) => row.id.toString()}
						/>,
						footerRight: () => <PageComponent />,
						footerLeft: () => (
							<div class="flex items-center gap-3">
								<NSelect
									v-model:value={batchActionRef.value}
									options={batchActionOptions}
									style={{ width: '120px' }}
									disabled={checkedRowKeysRef.value.length === 0}
									size="small"
								/>
								<NButton 
									size="small"
									class="gradient-primary-btn"
									disabled={checkedRowKeysRef.value.length === 0} type="primary" onClick={handleBatchAction}>
									批量操作
								</NButton>
								<span class="text-gray-500">已选中 {checkedRowKeysRef.value.length} 项</span>
							</div>
						),
					}}
				></BaseComponent>
			</div>
		)
	},
})
