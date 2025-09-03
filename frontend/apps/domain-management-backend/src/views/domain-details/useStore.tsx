/**
 * 域名详情页面状态管理
 * 负责管理域名详情数据、DNS记录、操作日志等状态
 */

import { fetchDomainDetail } from "@/api/domain";
import { useError } from "@baota/hooks/error";

import type { DomainInfo, RealNameInfo } from "@/types/domain";

const { handleError } = useError();

/**
 * 域名详情页面状态Store
 */
export const useDomainDetailStore = defineStore("domain-detail-store", () => {
  // -------------------- 状态定义 --------------------

  /** 页面加载状态 */
  const loading = ref(false);

  /** 域名详情信息 */
  const domainInfo = ref<DomainInfo | null>(null);

  /** 实名认证信息 */
  const realNameInfo = ref<RealNameInfo | null>(null);

  // -------------------- 方法定义 --------------------

  /**
   * 获取域名详情
   * @param domainId 域名ID
   */
  const fetchDomainInfo = async (domainId: number | string) => {
    try {
      const { fetch, data } = fetchDomainDetail({
        domain_id: Number(domainId),
      });
      await fetch();
      const { status, data: rdata } = data.value;
      if (status) {
        domainInfo.value = rdata.domain_info;
        realNameInfo.value = rdata.real_name_info;
      }
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  return {
    // 状态
    loading,
    domainInfo,
    realNameInfo,

    // 方法
    fetchDomainInfo,
  };
});

export const useDomainDetailState = () => {
  const store = useDomainDetailStore();
  return { ...store, ...storeToRefs(store) };
};
