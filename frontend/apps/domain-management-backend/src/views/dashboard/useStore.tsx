/**
 * 仪表板状态管理 - Pinia Store
 * 职责：存储仪表板页面所需的响应式数据及纯数据操作方法
 */

import { defineStore, storeToRefs } from "pinia";
import { ref, computed } from "vue";

import type {
  OverviewCard,
  DomainOverviewItem,
  DashboardData,
  QuickAction,
} from "./types.d";
import type { INotificationItem } from "@/components/layout/types";
import type { CartListData, CreateOrderPayInfo } from '@/types/dashboard'

/** 仪表板 - 快捷操作配置 */
const DASHBOARD_QUICK_ACTIONS = [
  {
    title: "注册域名",
    icon: "Plus",
    iconColor: "#18a058",
    path: "https://www.bt.cn/new/domain-register.html",
    type: "success",
  },
  // {
  //   title: "批量注册",
  //   icon: "Server",
  //   iconColor: "#2080f0",
  //   path: "/domain/batch-register",
  //   type: "primary",
  // },
  {
    title: "账户充值",
    icon: "CreditCard",
    iconColor: "#f0a020",
    path: "/recharge",
    type: "warning",
  },
  {
    title: "实名认证",
    icon: "FileText",
    iconColor: "#d03050",
    path: "/real-name-auth",
    type: "error",
  },
] as const;

/** 仪表板 - 概览卡片元数据（值由状态驱动） */
const DASHBOARD_OVERVIEW_CARD_META = [
  {
    key: "totalDomains",
    title: "我的域名",
    description: "全部正常",
    icon: "CheckCircle",
    iconColor: "#2080f0",
    path: "/domain",
  },
  {
    key: "expiringDomains",
    title: "即将到期",
    description: "30天内",
    icon: "Clock",
    iconColor: "#f0a020",
    path: "/domain?status=2",
  },
  {
    key: "pendingOrders",
    title: "待支付订单",
    description: "需要处理",
    icon: "AlertTriangle",
    iconColor: "#d03050",
    path: "/order?status=pending",
  },
  // {
  //   key: "accountBalance",
  //   title: "账户余额",
  //   description: "可用余额",
  //   icon: "Wallet",
  //   iconColor: "#18a058",
  //   path: "https://www.bt.cn/admin/recharge",
  // },
] as const;

/**
 * 仪表板状态管理 Store
 * @description 使用 Pinia 管理仪表板相关的状态和操作
 */
export const useDashboardStore = defineStore(
  "dashboard-store",
  () => {
    // ==================== 状态定义 ====================

    /** 加载状态 */
    const isLoading = ref(false);

    /** 仪表板数据 */
    const dashboardData = ref<DashboardData>({
      totalDomains: 0,
      expiringDomains: 0,
      pendingOrders: 0,
      accountBalance: 0,
      domains: [],
      orders: [],
      notifications: [],
    });

    /** 购物车加载与数据 */
    const cartLoading = ref(false);
		const cartListInfo = ref<CartListData>({
			items: [],
			original_price: 0,
			selected_count: 0,
			selected_price: 0,
			total_count: 0,
			total_price: 0,
		})
		
		const setCartLoading = (val: boolean) => (cartLoading.value = val)

    // ==================== 计算属性 ====================

    /** 快捷操作列表 */
    const quickActions = computed<QuickAction[]>(() =>
      DASHBOARD_QUICK_ACTIONS.map((action) => ({ ...action })),
    );

    /** 数据总览卡片列表 */
    const overviewCards = computed<OverviewCard[]>(() =>
      DASHBOARD_OVERVIEW_CARD_META.map((meta) => {
        let value: string | number = 0;
        switch (meta.key) {
          case "totalDomains":
            value = dashboardData.value.totalDomains;
            break;
          case "expiringDomains":
            value = dashboardData.value.expiringDomains;
            break;
          case "pendingOrders":
            value = dashboardData.value.pendingOrders;
            break;
          // case "accountBalance":
          //   value = `¥${(dashboardData.value.accountBalance || 0).toLocaleString()}`;
          //   break;
        }
        return {
          title: meta.title,
          value,
          description: meta.description,
          icon: meta.icon,
          iconColor: meta.iconColor,
          path: meta.path,
        };
      }),
    );

    // ==================== 纯数据操作方法 ====================

    /**
     * 设置仪表板数据
     * @param data 仪表板数据
     */
    const setDashboardData = (data: DashboardData): void => {
      dashboardData.value = { ...data };
    };

    /**
     * 设置加载状态
     * @param {boolean} loading 加载状态
     */
    const setLoading = (loading: boolean): void => {
      isLoading.value = loading;
    };

    /** 清空仪表板数据 */
    const clearDashboardData = (): void => {
      dashboardData.value = {
        totalDomains: 0,
        expiringDomains: 0,
        pendingOrders: 0,
        accountBalance: 0,
        domains: [],
        orders: [],
        notifications: [],
      };
    };

    /**
     * 添加域名到列表（函数式编程方式）
     * @param domain 域名数据
     */
    const addDomain = (domain: DomainOverviewItem): void => {
      const newDomains = [...dashboardData.value.domains, domain];
      dashboardData.value = {
        ...dashboardData.value,
        domains: newDomains,
      };
    };

    /**
     * 移除域名从列表（函数式编程方式）
     * @param domainId 域名ID
     */
    const removeDomain = (domainId: number): void => {
      const filtered = dashboardData.value.domains.filter(
        (d) => d.id !== domainId,
      );
      dashboardData.value = {
        ...dashboardData.value,
        domains: filtered,
      };
    };

    /**
     * 添加通知到列表（函数式编程方式）
     * @param notification 通知数据
     */
    const addNotification = (notification: INotificationItem): void => {
      const newNotifications = [
        notification,
        ...dashboardData.value.notifications,
      ];
      dashboardData.value = {
        ...dashboardData.value,
        notifications: newNotifications,
      };
		};
		
		/**
		 * 设置购物车数据
		 * @param data 购物车数据
		 */
		const setCartListInfo = (data: CartListData) => {
			cartListInfo.value = data
		}

    // ==================== 结算相关状态 ====================
    /** 结算流程 loading */
    const checkoutLoading = ref(false)
    /** 实名下拉 options */
    const realNameOptions = ref<Array<{ label: string; value: number }>>([])
    /** 已选择的实名模板ID */
    const selectedRealNameId = ref<number | null>(null)
    /** 步骤：1 选择实名；2 支付 */
    const checkoutStep = ref<1 | 2>(1)
    /** 支付渠道 */
    const payChannel = ref<'wechat' | 'alipay' | 'balance'>('wechat')
    /** 创建订单后返回的支付信息 */
    const orderPayInfo = ref<CreateOrderPayInfo>()
    /** 可用余额（来自充值模块 overview.balance） */
    const balanceAvailable = ref<number>(0)

    const setCheckoutLoading = (v: boolean) => (checkoutLoading.value = v)
    const setRealNameOptions = (opts: Array<{ label: string; value: number }>) => (realNameOptions.value = opts || [])
    const setSelectedRealNameId = (id: number | null) => (selectedRealNameId.value = id)
    const setCheckoutStep = (s: 1 | 2) => (checkoutStep.value = s)
    const setPayChannel = (c: 'wechat' | 'alipay' | 'balance') => (payChannel.value = c)
    const setOrderPayInfo = (info: CreateOrderPayInfo) => (orderPayInfo.value = info)
    const setBalanceAvailable = (val: number) => (balanceAvailable.value = Number(val || 0))
    const resetCheckout = () => {
      checkoutLoading.value = false
      realNameOptions.value = []
      selectedRealNameId.value = null
      checkoutStep.value = 1
      payChannel.value = 'wechat'
			orderPayInfo.value = {
				order_id: 0,
				total_price: 0,
				create_time: '',
				discount_price: 0,
				domain_count: 0,
				expire_time: '',
				order_no: '',
				original_price: 0,
				payment_url: '',
				wx: '',
				ali: '',
			}
      balanceAvailable.value = 0
    }
 
    return {
      // 响应式状态
      isLoading,
      dashboardData,
      cartLoading,
      cartListInfo,
      checkoutLoading,
      realNameOptions,
      selectedRealNameId,
      checkoutStep,
      payChannel,
      orderPayInfo,
      balanceAvailable,

      // 计算属性
      overviewCards,
      quickActions,

      // 纯数据操作方法
      setDashboardData,
      setLoading,
      clearDashboardData,
      addDomain,
      removeDomain,
      addNotification,
      setCartLoading,
      setCartListInfo,
      setCheckoutLoading,
      setRealNameOptions,
      setSelectedRealNameId,
      setCheckoutStep,
      setPayChannel,
      setOrderPayInfo,
      setBalanceAvailable,
      resetCheckout,
    }
  },
  {
    persist: true,
  },
);

/**
 * 组合式 API 使用 Dashboard Store
 * @description 提供对仪表板 Store 的访问，并返回响应式引用
 * @returns {Object} 包含所有 store 状态和方法的对象
 */
export const useDashboardState = () => {
  const store = useDashboardStore();
  return { ...store, ...storeToRefs(store) };
};
