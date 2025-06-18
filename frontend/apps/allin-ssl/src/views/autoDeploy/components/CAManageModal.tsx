import { defineComponent } from 'vue'
import { NButton } from 'naive-ui'
import { PlusOutlined } from '@vicons/antd'
import { $t } from '@locales/index'
import { useCAManageController } from '../useController'
import EmptyState from '@components/TableEmptyState'
import BaseComponent from '@components/BaseLayout'

/**
 * ACME账户管理模态框组件
 */
export default defineComponent({
	name: 'CAManageModal',
	props: {
		type: {
			type: String,
			default: '',
		},
	},
	setup(props) {
		const { TableComponent, PageComponent, handleOpenAddForm, total } = useCAManageController(props)
		return () => (
			<BaseComponent
				v-slots={{
					headerLeft: () => (
						<NButton type="primary" onClick={handleOpenAddForm}>
							<PlusOutlined class="text-[var(--text-color-3)] mr-1" />
							<span>{$t('t_4_1747903685371')}</span>
						</NButton>
					),
					content: () => (
						<div class="rounded-lg">
							<TableComponent
								size="medium"
								v-slots={{
									empty: () => <EmptyState addButtonText={$t('t_4_1747903685371')} onAddClick={handleOpenAddForm} />,
								}}
							/>
						</div>
					),
					footerRight: () => (
						<div class="flex justify-end mt-4">
							<PageComponent
								v-slots={{
									prefix: () => (
										<span>
											{$t('t_15_1745227839354')} {total.value} {$t('t_16_1745227838930')}
										</span>
									),
								}}
							/>
						</div>
					),
				}}
			/>
		)
	},
})
