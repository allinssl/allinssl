/**
 * 域名详情页面状态管理
 * 负责管理域名详情数据、DNS记录、操作日志等状态
 */

import { fetchDomainDetail } from '@/api/domain'
import { fetchContactUserDetail } from '@/api/real-name'
import { useError } from '@baota/hooks/error'

import type { DomainInfo, RealNameInfo, PrivacyInfo } from '@/types/domain'
import type { ContactTemplateItem } from '@/types/real-name'

const { handleError } = useError()

/**
 * 域名详情页面状态Store
 */
export const useDomainDetailStore = defineStore('domain-detail-store', () => {
	// -------------------- 状态定义 --------------------

	/** 页面加载状态 */
	const loading = ref(false)

	/** 域名详情信息 */
	const domainInfo = ref<DomainInfo | null>(null)

	/** 实名认证信息 */
	const realNameInfo = ref<RealNameInfo | null>(null)

	/** 实名信息更新状态 */
	const realNameInfoUpdating = ref<RealNameInfo | null>(null)

	/** 实名模板更换弹窗控制 */
	const openTemplateChangeDialog = ref()
	/** DNS服务器弹窗控制 */
	const openDnsChangeDialog = ref()

	/** 实名模板相关状态 */
	const realNameTemplates = ref<ContactTemplateItem[]>([])
	const realNameTemplatesLoading = ref(false)

	/** 隐私保护弹窗控制 */
	const openPrivacyDialog = ref()

	/** 隐私保护信息 */
	const privacyInfo = ref<PrivacyInfo | null>(null)

	/** 内部转移状态 */
	const insideTransferStatus = ref<{
		domain: string
		status: number
		to_account: string
		transfer_code: string
	} | null>(null)

	/** 外部转移状态 */
	const outsideTransferStatus = ref<number | null>(null)

	// -------------------- 方法定义 --------------------

	/**
	 * 获取域名详情
	 * @param domainId 域名ID
	 */
	const fetchDomainInfo = async (domainId: number | string) => {
		try {
			const { fetch, data } = fetchDomainDetail({
				domain_id: Number(domainId),
			})
			await fetch()
			const { status, data: rdata } = data.value
			if (status) {
				domainInfo.value = rdata.domain_info
				realNameInfo.value = rdata.real_name_info
				realNameInfoUpdating.value = rdata.real_name_update_info
				privacyInfo.value = rdata.privacy_info
				insideTransferStatus.value = rdata.inside_transfer_status
				outsideTransferStatus.value = rdata.outside_transfer_status
			}
		} catch (error) {
			handleError(error)
			return null
		}
	}

	/**
	 * 获取实名模板列表
	 */
	const fetchRealNameTemplateList = async () => {
		try {
			realNameTemplatesLoading.value = true
			const { fetch, data } = fetchContactUserDetail({ p: 1, rows: 50, status: 2 })
			await fetch()
			const payload = data.value as any
			const list = (payload?.msg?.data || payload?.data?.data || []) as ContactTemplateItem[]
			realNameTemplates.value = Array.isArray(list) ? list : []
		} catch (error) {
			handleError(error)
			realNameTemplates.value = []
		} finally {
			realNameTemplatesLoading.value = false
		}
	}

	return {
		// 状态
		loading,
		domainInfo,
		privacyInfo,
		realNameInfo,
		realNameInfoUpdating,
		openTemplateChangeDialog,
		openDnsChangeDialog,
		realNameTemplates,
		realNameTemplatesLoading,
		openPrivacyDialog,
		insideTransferStatus,
		outsideTransferStatus,

		// 方法
		fetchDomainInfo,
		fetchRealNameTemplateList,
	}
})

export const useDomainDetailState = () => {
	const store = useDomainDetailStore()
	return { ...store, ...storeToRefs(store) }
}
