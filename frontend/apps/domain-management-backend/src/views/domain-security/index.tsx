/**
 * 域名安全页面
 */
import { defineComponent, defineAsyncComponent } from 'vue'
import { NTabs, NTabPane, NCard } from 'naive-ui'
import { useController } from './useController'

/**
 * 页面组件
 */
export default defineComponent({
	name: 'DomainSecurityView',
	setup() {
		// 异步组件导入
		const ApiManagement = defineAsyncComponent(() => import('./components/ApiManagement'))
		const BasicSecurity = defineAsyncComponent(() => import('./components/BasicSecurity'))
		const OperationProtection = defineAsyncComponent(() => import('./components/OperationProtection'))
		const GlobalTransferLock = defineAsyncComponent(() => import('./components/GlobalTransferLock'))
		const PanelWhitelist = defineAsyncComponent(() => import('./components/PanelWhitelist'))

		// 获取控制器
		const { loading, activeTab, switchTab } = useController()

		return () => (
			<div class="domain-security-container">
				<NCard class="card-shadow" bordered={false}>
					{/* 标签页导航区 */}
					<NTabs value={activeTab.value} onUpdateValue={switchTab} type="line" animated class="mb-4">
						<NTabPane name="basic-security" tab="基础安全">
							<BasicSecurity />
						</NTabPane>
						<NTabPane name="operation-protection" tab="敏感操作限制">
							<OperationProtection />
						</NTabPane>
						<NTabPane name="global-transfer-lock" tab="全局转移锁">
							<GlobalTransferLock />
						</NTabPane>
						<NTabPane name="api-management" tab="API管理">
							<ApiManagement />
						</NTabPane>
						<NTabPane name="panel-whitelist" tab="面板IP白名单">
							<PanelWhitelist />
						</NTabPane>
					</NTabs>
				</NCard>
			</div>
		)
	},
})
