/**
 * 域名管理页面状态管理
 * 负责管理域名数据、筛选条件、分页等状态
 */

import { ref } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { useMessage } from "@baota/naive-ui/hooks";
import { useError } from "@baota/hooks/error";
import { fetchDomainList } from "@/api/domain";

import type { TableResponse } from "@baota/naive-ui/types/table";
import type { SuffixOption, StatusOption } from "./types.d";
import type { DomainItem, DomainListRequest } from "@/types/domain";
import type { RenewData } from "@/types/order";
import type { DomainPriceResult } from "@/types/domain";

/** 域名状态映射配置（后端数值 -> 前端联合类型） */
const DOMAIN_STATUS_MAP: Record<
  number,
  "pending" | "active" | "inactive" | "expired" | "suspended" | "failed"
> = {
  0: "pending", // 注册中
  1: "active", // 正常
  2: "inactive", // 即将到期
  3: "expired", // 已过期
  4: "suspended", // 待赎回
  5: "failed", // 注册失败
} as const;

/** 域名状态显示配置 */
const DOMAIN_STATUS_CONFIG = {
  active: {
    type: "success" as const,
    text: "正常",
    color: "#18a058", // 绿色
  },
  inactive: {
    type: "warning" as const,
    text: "即将到期",
    color: "#f0a020", // 橙色
  },
  expired: {
    type: "error" as const,
    text: "已过期",
    color: "#d03050", // 红色
  },
  pending: {
    type: "info" as const,
    text: "注册中",
    color: "#2080f0", // 蓝色
  },
  suspended: {
    type: "default" as const,
    text: "待赎回",
    color: "#666666", // 灰色
  },
  failed: {
    type: "error" as const,
    text: "注册失败",
    color: "#d03050", // 红色
  },
} as const;

const message = useMessage();
const { handleError } = useError();

/**
 * 域名管理页面状态Store
 */
export const useDomainStore = defineStore("domain-store", () => {
  // -------------------- 状态定义 --------------------

  /** 页面加载状态 */
  const loading = ref(false);

  /** 域名状态选项（固定） */
  const statusOptions = ref<StatusOption[]>([
    { label: "全部状态", value: "" },
    { label: "注册中", value: 0 },
    { label: "正常", value: 1 },
    { label: "即将到期", value: 2 },
    { label: "已过期", value: 3 },
    { label: "待赎回", value: 4 },
    { label: "注册失败", value: 5 },
  ]);

  /** 域名后缀选项（从接口或静态配置加载，这里默认空，首次请求列表后根据数据生成） */
  const suffixOptions = ref<SuffixOption[]>([
    {
      label: "全部后缀",
      value: "",
    },
    {
      label: "com",
      value: "com",
    },
    {
      label: "net",
      value: "net",
    },
    {
      label: "org",
      value: "org",
    },
    {
      label: "cn",
      value: "cn",
    },
    {
      label: "top",
      value: "top",
    },
  ]);

  const filterFormData = ref<DomainListRequest>({
    p: 1,
    rows: 10,
    status: "",
    suffix: "",
    keyword: "",
  });

  // -------------------- 方法定义 --------------------

  /**
   * 获取域名列表数据
   * @param params 查询参数
   */
  const fetchDomainListData = async <T = DomainItem,>(
    params: DomainListRequest = {},
  ): Promise<TableResponse<T>> => {
    try {
      loading.value = true;
			const { data } = await fetchDomainList(params).fetch();
      return { list: data?.data as T[], total: data?.count || 0 };
    } catch (error) {
      handleError(error);
      message.error("加载域名列表失败");
      console.error(error);
      return { list: [] as T[], total: 0 };
    } finally {
      loading.value = false;
    }
  };

  // -------------------- 续费弹窗相关状态（合并到域名模块） --------------------
  const renewLoading = ref(false)
  const renewStep = ref<1 | 2>(1)
  const renewSelectedYear = ref<number>(1)
  const renewPayChannel = ref<'wechat' | 'alipay' | 'balance'>('wechat')
  const renewOrderInfo = ref<RenewData | null>(null)
  const renewPriceInfo = ref<DomainPriceResult | null>(null)
  const renewBalanceAvailable = ref<number>(0)
  const renewCurrentDomain = ref<DomainItem | null>(null)
  const renewNewExpireDate = ref<string>('')

  const setRenewLoading = (v: boolean) => (renewLoading.value = v)
  const setRenewStep = (s: 1 | 2) => (renewStep.value = s)
  const setRenewSelectedYear = (y: number) => (renewSelectedYear.value = y)
  const setRenewPayChannel = (c: 'wechat' | 'alipay' | 'balance') => (renewPayChannel.value = c)
  const setRenewOrderInfo = (info: RenewData | null) => (renewOrderInfo.value = info)
  const setRenewPriceInfo = (info: DomainPriceResult | null) => (renewPriceInfo.value = info)
  const setRenewBalance = (v: number) => (renewBalanceAvailable.value = Number(v || 0))
  const setRenewCurrentDomain = (d: DomainItem | null) => (renewCurrentDomain.value = d)
  const setRenewNewExpireDate = (v: string) => (renewNewExpireDate.value = v || '')
  const resetRenew = () => {
    renewLoading.value = false
    renewStep.value = 1
    renewSelectedYear.value = 1
    renewPayChannel.value = 'wechat'
    renewOrderInfo.value = null
    renewPriceInfo.value = null
    renewBalanceAvailable.value = 0
    renewCurrentDomain.value = null
    renewNewExpireDate.value = ''
  }

  // 返回状态和方法
  return {
    // 状态
    loading,
    statusOptions,
    suffixOptions,
    filterFormData,
    // 续费
    renewLoading,
    renewStep,
    renewSelectedYear,
    renewPayChannel,
    renewOrderInfo,
    renewPriceInfo,
    renewBalanceAvailable,
    renewCurrentDomain,
    renewNewExpireDate,

    // 方法
    fetchDomainListData,
    setRenewLoading,
    setRenewStep,
    setRenewSelectedYear,
    setRenewPayChannel,
    setRenewOrderInfo,
    setRenewPriceInfo,
    setRenewBalance,
    setRenewCurrentDomain,
    setRenewNewExpireDate,
    resetRenew,

    // 常量
    DOMAIN_STATUS_CONFIG,
    DOMAIN_STATUS_MAP,
  };
});

/**
 * 导出Store实例
 */
export const useDomainState = () => {
  const store = useDomainStore();
  return {
    ...store,
    ...storeToRefs(store),
  };
};
