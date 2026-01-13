/**
 * 域名转入转出页面状态管理
 * 负责管理域名转入转出页面的数据、状态和操作
 */

import { useError } from "@baota/hooks/error";
import type { DomainTransferTabKey } from './types.d'

const { handleError } = useError();

/**
 * 域名转入转出页面状态Store
 */
export const useDomainTransferStore = defineStore(
	'domain-transfer-store',
	() => {
		// -------------------- 状态定义 --------------------

		/** 页面加载状态 */
		const loading = ref(false)
		// 当前激活的标签页
		const activeTab = ref<DomainTransferTabKey>('join')

		// -------------------- 方法定义 --------------------

		return {
			// 状态
			loading,
			activeTab,
			// 方法
		}
	},
	{
		// 配置持久化
		persist: true,
	},
)

export const useDomainTransferState = () => {
  const store = useDomainTransferStore()
  return { ...store, ...storeToRefs(store) };
};
