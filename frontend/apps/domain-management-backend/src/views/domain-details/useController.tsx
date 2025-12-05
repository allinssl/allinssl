/**
 * 域名详情页面控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useModal } from '@baota/naive-ui/hooks'
import { useDomainDetailState } from './useStore'
import { domainUtils } from './config'
import type { DomainDetailTabKey } from './types.d'
import DnsSettingsDialog from './components/DnsSettingsDialog'
// 动态导入组件以避免循环依赖问题
// import RealNameTemplateChangeDialog from "./components/RealNameTemplateChangeDialog";

/**
 * 域名详情页面控制器
 * @param domainId 域名ID
 */
export function useController(domainId: string | number) {
	// 获取状态管理
	const {
		loading,
		domainInfo,
		privacyInfo,
		fetchDomainInfo,
		realNameInfo,
		realNameInfoUpdating,
		openTemplateChangeDialog,
		openDnsChangeDialog,
		openPrivacyDialog,
		fetchRealNameTemplateList,
		insideTransferStatus,
		outsideTransferStatus,
	} = useDomainDetailState()
	const route = useRoute()

	// 当前激活的标签页
	const activeTab = ref<DomainDetailTabKey>('base')

	/**
	 * 刷新域名详情
	 * 用于更新实名状态等信息
	 */
	const refreshDomainInfo = async () => {
		try {
			await fetchDomainInfo(domainId)
		} catch (error) {
			// 错误已在store中处理
		}
	}

	/**
	 * 切换标签页
	 * @param tab 标签页键值
	 */
	const switchTab = (tab: DomainDetailTabKey) => {
		activeTab.value = tab
	}

	/**
	 * 打开实名模板更换弹窗
	 */
	const openTemplateChangeModal = async () => {
		// 先加载实名模板列表
		await fetchRealNameTemplateList()

		// 遵循 real-name 模式，将 useModal 结果赋值给 store 中的 ref
		openTemplateChangeDialog.value = useModal({
			title: '更换实名模板',
			area: '650px',
			component: () => import('./components/RealNameTemplateChangeDialog'),
			componentProps: {
				domainId: Number(domainId),
				domainInfo: domainInfo.value,
				isNotReal: false,
				currentTemplate: realNameInfo.value,
				refresh: async () => {
					// 刷新域名信息
					await fetchDomainInfo(domainId)
				},
			},
			footer: false,
		})
	}

	/**
	 * 打开DNS服务器设置弹窗
	 */
	const openDnsSettingsModal = () => {
		openDnsChangeDialog.value = useModal({
			title: '修改DNS服务器',
			area: '500px',
			component: DnsSettingsDialog,
			componentProps: {
				domainId: Number(domainId),
				domainInfo: domainInfo.value,
				refresh: async () => {
					// 刷新域名信息
					await fetchDomainInfo(domainId)
				},
			},
			footer: false,
		})
	}

	// 组件挂载时获取域名详情
	onMounted(() => {
		if (route.query.tabs) activeTab.value = route.query.tabs as DomainDetailTabKey
		fetchDomainInfo(domainId)
	})

	return {
		// 状态
		loading,
		domainInfo,
		privacyInfo,
		realNameInfo,
		realNameInfoUpdating,
		activeTab,
		switchTab,
		insideTransferStatus,
		outsideTransferStatus,
		// 方法
		refreshDomainInfo,
		openTemplateChangeModal,
		openDnsSettingsModal,
		// 工具
		domainUtils,
	}
}
