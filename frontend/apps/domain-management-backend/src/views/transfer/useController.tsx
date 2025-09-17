/**
 * 域名详情页面控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { ref, onMounted } from 'vue'
import { useDomainTransferStore } from './useStore'
import type { DomainTransferTabKey } from './types.d'

/**
 * 域名转入转出页面控制器
 */
export function useController() {
	// 获取状态管理
	const { loading } = useDomainTransferStore()

	// 当前激活的标签页
	const activeTab = ref<DomainTransferTabKey>('join')

	/**
	 * 切换标签页
	 * @param tab 标签页键值
	 */
	const switchTab = (tab: DomainTransferTabKey) => {
		activeTab.value = tab
	}

	// 组件挂载时获取域名详情
	onMounted(() => {
		
	})

	return {
		// 状态
		loading,
		
		activeTab,
		switchTab,
		// 方法
		
		// 工具
	}
}
