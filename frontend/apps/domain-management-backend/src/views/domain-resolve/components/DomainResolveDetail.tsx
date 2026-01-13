/**
 * 域名解析详情页面
 * 职责：展示指定域名的DNS解析记录列表和管理功能
 */

import { defineComponent, onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NCard, NButton, NIcon, NFlex, NText, NSpin } from 'naive-ui'
import { ArrowBackOutline, ReloadOutline } from '@vicons/ionicons5'
import { useMessage } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { useDomainResolveState } from '../useStore'

// 引入DNS解析组件
import DnsAnalysisComponent from './DnsAnalysis/index'

/**
 * 域名解析详情页面组件
 */
export default defineComponent({
	name: 'DomainResolveDetail',
	setup() {
		const route = useRoute()
		const router = useRouter()
		const message = useMessage()
		const { handleError } = useError()
		const { selectedDomainInfo, clearSelectedDomainInfo } = useDomainResolveState()
		
		// 获取域名ID参数
		const domainId = Number(route.params.id)
		
		// 跨组件初始化流程
		// 1. 判断 route.query.domain_type 是否存在，有的话就按照传的来获取值，没用就默认1
		const domainType = computed(() => {
			if (route.query.domain_type) {
				return Number(route.query.domain_type)
			}
			// 如果是从内部跳转，使用Store中的信息
			if (selectedDomainInfo.value) {
				return selectedDomainInfo.value.domain_type
			}
			return 1 // 默认值
		})
		
		// 2. 判断 route.query.domain_name 是否存在，有的话就获取值，没用的话默认空
		const domainName = computed(() => {
			if (route.query.domain_name) {
				return route.query.domain_name as string
			}
			// 如果是从内部跳转，使用Store中的信息
			if (selectedDomainInfo.value) {
				return selectedDomainInfo.value.name
			}
			return ''
		})

		// 返回到域名解析列表页面
		const handleBack = () => {
			// 清除Store中的选中域名信息
			clearSelectedDomainInfo()
			router.push('/domain-resolve')
		}

		return () => (
			<div class="domain-resolve-detail-container">
				{/* 返回导航区 */}
				<div class="mb-4 flex items-center">
					<NButton
						circle
						size="medium"
						onClick={handleBack}
						class="hover:bg-gray-100 transition-colors"
					>
						<NIcon size="16">
							<ArrowBackOutline />
						</NIcon>
					</NButton>
					<NFlex align="center" class="ml-4">
						<NText class="text-lg font-semibold text-gray-900">域名解析</NText>
						{domainName.value && (
							<>
								<NText class="text-gray-400">-</NText>
								<NText class="text-sm text-gray-500">{domainName.value}</NText>
							</>
						)}
					</NFlex>
				</div>

				{/* DNS解析记录内容区 */}
				<NCard class="card-shadow" bordered={false}>
					{domainId > 0 && (
						<DnsAnalysisComponent domainId={domainId} domainType={domainType.value} />
					)}
				</NCard>
			</div>
		)
	},
})
