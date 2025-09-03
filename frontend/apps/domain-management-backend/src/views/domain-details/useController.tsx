/**
 * 域名详情页面控制器
 * 负责处理业务逻辑、事件响应和生命周期管理
 */

import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
// import { useMessage } from "naive-ui";
// import { useDialog } from "@baota/naive-ui/hooks";
import { useDomainDetailState } from "./useStore";
import { domainUtils } from "./config";
import type { DomainDetailTabKey } from "./types.d";

/**
 * 域名详情页面控制器
 * @param domainId 域名ID
 */
export function useController(domainId: string | number) {
  // 获取状态管理
  const { loading, domainInfo, fetchDomainInfo, realNameInfo } =
    useDomainDetailState();
  const route = useRoute();

  // 当前激活的标签页
  const activeTab = ref<DomainDetailTabKey>("base");

  /**
   * 刷新域名详情
   */
  const refreshDomainInfo = () => {
    fetchDomainInfo(domainId);
  };

  /**
   * 切换标签页
   * @param tab 标签页键值
   */
  const switchTab = (tab: DomainDetailTabKey) => {
    activeTab.value = tab;
  };

  // 组件挂载时获取域名详情
  onMounted(() => {
    if (route.query.tabs)
      activeTab.value = route.query.tabs as DomainDetailTabKey;
    fetchDomainInfo(domainId);
  });

  return {
    // 状态
    loading,
    domainInfo,
    realNameInfo,
    activeTab,
    switchTab,
    // 方法
    refreshDomainInfo,
    // 工具
    domainUtils,
  };
}
