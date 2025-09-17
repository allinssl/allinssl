/**
 * 域名转入转出
 */
import { defineComponent, defineAsyncComponent } from 'vue'
import { NTabs, NTabPane, NCard } from 'naive-ui'
import { useController } from './useController'
import type{ DomainTransferTabKey } from './types'

/**
 * 页面组件
 */
export default defineComponent({
	name: 'DomainTransferView',
	setup() {
		const JoinIn = defineAsyncComponent(() => import('./components/JoinIn'))

		// 获取控制器
		const { loading, activeTab, switchTab } = useController()

		return () => (
			<div class="domain-transfer-container">
				<NCard class="card-shadow" bordered={false}>
					{/* 标签页导航区 */}
					<NTabs
						value={activeTab.value}
						onUpdateValue={(val: DomainTransferTabKey) => switchTab(val)}
						type="line"
						animated
						class="mb-4"
					>
						<NTabPane name="join" tab="域名转入">
							<JoinIn/>
						</NTabPane>
						<NTabPane name="level" tab="域名转出">
						</NTabPane>
					</NTabs>
				</NCard>
			</div>
		)
	},
})
