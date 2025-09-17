/**
 * 域名详情页面
 * 职责：渲染域名详情界面，展示基本信息、实名认证、域名解析、操作日志等
 */

import { defineComponent, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NTabs, NTabPane, NCard, NButton, NIcon } from 'naive-ui'
import { useController } from './useController'
import { ArrowBackOutline } from '@vicons/ionicons5'

import type { DomainDetailTabKey } from './types.d'

/**
 * 域名详情页面组件
 */
export default defineComponent({
	name: 'DomainDetail',
	setup() {
		const route = useRoute()
		const router = useRouter()
		const BaseInfo = defineAsyncComponent(() => import('./components/BaseInfo'))
		const RealName = defineAsyncComponent(() => import('./components/RealName'))
		const Security = defineAsyncComponent(() => import('./components/security'))

		// 获取域名ID（从路由参数中获取）
		const domainId = route.params.id as string
		// 获取控制器
		const { loading, domainInfo,privacyInfo, activeTab, refreshDomainInfo, switchTab } = useController(domainId)

		return () => (
			<div class="domain-detail-container">
				{/* 返回导航区 */}
				<div class="mb-4 flex items-center">
					<NButton
						circle
						size="medium"
						onClick={() => router.push('/domain/list')}
						class="hover:bg-gray-100 transition-colors"
					>
						<NIcon size="16">
							<ArrowBackOutline />
						</NIcon>
					</NButton>
					<div class="flex flex-row ml-4 items-center">
						<span class="text-lg font-semibold my-0 text-gray-900">域名详情</span> &nbsp;-&nbsp;
						{domainInfo.value?.full_domain && <span class="text-sm text-gray-500">{domainInfo.value.full_domain}</span>}
					</div>
				</div>
				<NCard class="card-shadow" bordered={false}>
					{/* 标签页导航区 */}
					<NTabs
						value={activeTab.value}
						onUpdateValue={(val: DomainDetailTabKey) => switchTab(val)}
						type="line"
						animated
						class="mb-4"
					>
						<NTabPane name="base" tab="基本信息">
							<BaseInfo
								domainInfo={domainInfo.value}
								privacyInfo={privacyInfo.value}
								loading={loading.value}
								onRefresh={refreshDomainInfo}
							/>
						</NTabPane>
						<NTabPane name="realName" tab="实名认证">
							<RealName domainId={Number(domainId)} />
						</NTabPane>
						<NTabPane name="security" tab="域名安全">
							<Security
								domainId={Number(domainId)}
								domainInfo={domainInfo.value}
								privacyInfo={privacyInfo.value}
								loading={loading.value}
								onRefresh={refreshDomainInfo}
							/>
						</NTabPane>
					</NTabs>
				</NCard>
			</div>
		)
	},
})
