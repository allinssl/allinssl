import { useHistoryController } from '@autoDeploy/useController'
import BaseComponent from '@components/BaseLayout'
import { $t } from '@locales/index'
import { NButton } from 'naive-ui'

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
		const { TableComponent, PageComponent, fetch } = useHistoryController(props.id)
		onMounted(() => {
			fetch()
		})
		return () => (
			<div class="flex w-full">
				<BaseComponent
					v-slots={{
						header: () => (
							<div class="flex items-center justify-between mb-[1.6rem]">
								<NButton type="default" onClick={() => fetch()}>
									{$t('t_9_1746667589516')}
								</NButton>
							</div>
						),
						content: () => <TableComponent />,
						footerRight: () => <PageComponent />,
					}}
				></BaseComponent>
			</div>
		)
	},
})
