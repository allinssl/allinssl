/**
 * 域名转入转出页面状态管理
 * 负责管理域名转入转出页面的数据、状态和操作
 */

import { useError } from "@baota/hooks/error";

const { handleError } = useError();

/**
 * 域名转入转出页面状态Store
 */
export const useDomainTransferStore = defineStore("domain-transfer-store", () => {
	// -------------------- 状态定义 --------------------

	/** 页面加载状态 */
	const loading = ref(false)

	// -------------------- 方法定义 --------------------

	return {
		// 状态
		loading,

		// 方法
	}
});

export const useDomainDetailState = () => {
  const store = useDomainTransferStore()
  return { ...store, ...storeToRefs(store) };
};
