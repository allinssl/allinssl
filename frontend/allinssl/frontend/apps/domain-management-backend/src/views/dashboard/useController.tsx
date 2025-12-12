/**
 * 仪表板视图控制器
 * 职责：处理业务逻辑、用户交互、数据请求和状态更新
 */

import { ref } from 'vue'
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { fetchDashboardOverview, fetchCartList, removeCartItem, createOrder, updateCart } from '@api/dashboard'
import { fetchContactUserDetail } from "@/api/real-name";
import { useRechargeState } from "@/views/recharge/useStore";
import { useRechargeController } from "@/views/recharge/useController";
import { useModal } from "@baota/naive-ui/hooks";
import DomainRegistrationForm from "@/views/real-name/components/DomainRegistrationForm/index";
import CheckoutDialog from './components/CheckoutDialog'
import { formatDate } from "@baota/utils/date";
import { queryPaymentStatus, buyByBalance } from '@/api/order'
import { useDashboardState } from "./useStore";
import type { CreateOrderRequest, CreateOrderPayInfo, CartItem } from '@/types/dashboard'

import type {
	DashboardOverviewData,
	DomainStatusTopItem,
	RecentOrderItem,
	CartListResponse,
} from '@/types/dashboard'
import type { QuickAction, DomainOverviewItem, OrderItem } from "./types.d";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-vue-next";

/** 域名状态映射配置（后端数值 -> 前端联合类型） */
const DOMAIN_STATUS_MAP: Record<
  number,
  "pending" | "active" | "inactive" | "expired" | "suspended"
> = {
  0: "pending",
  1: "active",
  2: "inactive",
  3: "expired",
  4: "suspended",
} as const;

/** 订单类型映射配置（后端数值 -> 前端联合类型） */
const ORDER_TYPE_MAP: Record<number, "register" | "renewal" | "transfer"> = {
  0: "register",
  1: "renewal",
  2: "transfer",
} as const;

/** 订单状态映射配置（后端数值 -> 前端联合类型） */
const ORDER_STATUS_MAP: Record<number, "pending" | "completed" | "failed"> = {
  0: "pending",
  1: "pending",
  2: "completed",
  3: "failed",
  10: "failed",
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
} as const;

/** 订单类型显示配置 */
const ORDER_TYPE_CONFIG = {
  register: "注册",
  renewal: "续费",
  transfer: "转入",
} as const;

/** 订单状态显示配置 */
const ORDER_STATUS_CONFIG = {
  completed: {
    type: "success" as const,
    text: "已完成",
    color: "#18a058", // 绿色
  },
  pending: {
    type: "warning" as const,
    text: "待支付",
    color: "#f0a020", // 橙色
  },
  failed: {
    type: "error" as const,
    text: "已取消",
    color: "#d03050", // 红色
  },
} as const;

/** 通知类型配置 */
const NOTIFICATION_CONFIG = {
  info: {
    icon: Info,
    color: "#2080f0",
  },
  success: {
    icon: CheckCircle2,
    color: "#18a058",
  },
  warning: {
    icon: AlertTriangle,
    color: "#f0a020",
  },
  error: {
    icon: AlertCircle,
    color: "#d03050",
  },
} as const;

const openCheckoutDialog = ref<{ close: () => void } | undefined>()

/**
 * 首页控制器
 */
/**
 * 仪表板视图控制器 Hook
 * 负责处理业务逻辑、用户交互、数据请求和状态更新
 * @returns {object} 包含状态、映射获取函数和事件处理函数
 * @property state - 页面状态与计算属性（来自 useDashboardState）
 * @property getDomainStatusType - 获取域名状态标签类型
 * @property getDomainStatusText - 获取域名状态文本
 * @property getDomainStatusColor - 获取域名状态颜色
 * @property getOrderTypeText - 获取订单类型文本
 * @property getOrderStatusType - 获取订单状态标签类型
 * @property getOrderStatusText - 获取订单状态文本
 * @property getNotificationIcon - 获取通知图标组件
 * @property getNotificationIconColor - 获取通知图标颜色
 * @property loadDashboardData - 加载仪表板数据
 * @property handleActionClick - 处理快捷操作点击
 * @property handleCardClick - 处理概览卡片点击
 * @property handleViewAllOrders - 跳转到订单列表
 * @property handleViewAllDomains - 跳转到域名列表
 */
export const useDashboardController = () => {
  const state = useDashboardState(); // 状态管理
  const router = useRouter(); // 路由实例
  const message = useMessage(); // 消息提示
  const recharge = useRechargeState();
  const { loadAccountBalance } = useRechargeController()
  let checkoutPollTimer: any

  /**
   * 转换域名状态概览项数据
   * @param domainStatusTop API返回的域名状态数据
   * @returns 转换后的域名概览项数组
   */
  const transformDomainData = (
    domainStatusTop: DomainStatusTopItem[],
  ): DomainOverviewItem[] => {
    if (!Array.isArray(domainStatusTop)) return [];
    return domainStatusTop.map(
      (item): DomainOverviewItem => ({
        id: item.id,
        name: item.full_domain || "",
        expireDate: item.expire_time
          ? formatDate(Number(item.expire_time), "yyyy-MM-dd")
          : "",
        status: transformDomainStatus(item.status),
      }),
    );
  };

  /**
   * 转换订单数据
   * @param recentOrders API返回的订单数据
   * @returns 转换后的订单项数组
   */
  const transformOrderData = (recentOrders: RecentOrderItem[]): OrderItem[] => {
    if (!Array.isArray(recentOrders)) return [];

    return recentOrders.map(
      (item): OrderItem => ({
        id: item.order_no ? String(item.order_no) : String(Math.random()),
        type: transformOrderType(item.order_type),
        domainName: item.full_domain || "",
        price: Number(item.total_amount) || 0,
        time: item.updated_at ? formatDate(Number(item.updated_at)) : "",
        status: transformOrderStatus(item.status),
      }),
    );
  };

  /**
   * 转换域名状态数值到前端类型
   * @param status 后端状态值 (0:待注册,1:正常,2:即将到期,3:已过期,4:待赎回)
   * @returns 前端状态类型
   */
  const transformDomainStatus = (
    status: number,
  ): DomainOverviewItem["status"] => {
    return DOMAIN_STATUS_MAP[status] ?? "pending";
  };

  /**
   * 转换订单类型数值到前端类型
   * @param orderType 后端订单类型值 (0:注册,1:续费,2:转入)
   * @returns 前端订单类型
   */
  const transformOrderType = (orderType: number): OrderItem["type"] => {
    return ORDER_TYPE_MAP[orderType] ?? "register";
  };

  /**
   * 转换订单状态数值到前端类型
   * @param status 后端状态值 (0:待处理,1:处理中,2:成功,3:失败,10:退款)
   * @returns 前端状态类型
   */
  const transformOrderStatus = (status: number): OrderItem["status"] => {
    return ORDER_STATUS_MAP[status] ?? "pending";
  };

  /**
   * 加载仪表板数据
   */
  const loadDashboardData = async (): Promise<void> => {
    try {
      state.setLoading(true);
      const response = await fetchDashboardOverview().fetch();
      const data = response?.data || ({} as DashboardOverviewData);

      // 转换数据格式并计算固定的空态标记
      const domainsData = transformDomainData(data.domain_status_top || []);
      const ordersData = transformOrderData(data.recent_orders || []);

      const dashboardData = {
        totalDomains: Number(data.total_domains) || 0,
        expiringDomains: Number(data.expiring_domains) || 0,
        pendingOrders: Number(data.pending_orders) || 0,
        accountBalance: 0, // API 中没有此字段，设置默认值
        domains: domainsData,
        orders: ordersData,
        notifications: [], // API 中没有通知数据，设置空数组
      };

      state.setDashboardData(dashboardData);
    } catch (err) {
      console.error("加载仪表板数据失败:", err);
      message.error("加载仪表板数据失败");
    } finally {
      state.setLoading(false);
    }
  };

  /**
   * 加载购物车数据
   */
  const loadCartList = async (): Promise<void> => {
    try {
      state.setCartLoading(true);
			const resp = await fetchCartList().fetch()
      const data = (resp?.data) as CartListResponse['data']
      state.setCartListInfo(data)
    } catch {
      message.error("购物车加载失败");
      state.setCartListInfo({
				items: [],
				original_price: 0,
				selected_count: 0,
				selected_price: 0,
				total_count: 0,
				total_price: 0,
			})
    } finally {
      state.setCartLoading(false);
    }
  };

  /** 从购物车移除并刷新 */
  const removeFromCart = async (cart_id: number) => {
		try {
			const resp = await removeCartItem({ cart_id }).fetch()
			if (resp.status) {
				await loadCartList()
				message.success('已移出购物车')
			} else {
				message.error('移除失败')
			}
		} catch {
			message.error('移除失败')
		}
	}

  /** 更新购物车年限并刷新 */
	const updateCartYear = async (row: CartItem, years: number) => {
		const { id, selected } = row
		console.log('updateCartYear', row, years)
    try {
      const resp = await updateCart({
				cart_id: Number(id),
				years,
				is_selected: Number(selected ?? 1), // 保持选中状态
			}).fetch()
			await loadCartList()
      if (resp.status) {
        message.success('年限已更新')
      } else {
        message.error('更新失败')
      }
    } catch {
      message.error('更新失败')
    }
  }

  /** 加载实名模板并转换为下拉 options */
  const loadRealNameOptions = async () => {
    try {
      state.setCheckoutLoading(true)
      const { fetch, data } = fetchContactUserDetail({ p: 1, rows: 50, status: 2 })
      await fetch()
      const payload = data.value as unknown as any
      const list = ((payload && payload.msg && payload.msg.data) || (payload && payload.data && payload.data.data) || []) as Array<import('@/types/real-name').ContactTemplateItem>
      const options = Array.isArray(list)
        ? list.map(it => ({ label: it.template_name || it.owner_name || String(it.id), value: it.id }))
        : []
      state.setRealNameOptions(options)
    } catch {
      message.error('加载实名模板失败')
      state.setRealNameOptions([])
    } finally {
      state.setCheckoutLoading(false)
    }
  }

  /** 拉取充值模块余额并写入结算状态 */
  const ensureBalance = async () => {
    try {
      await loadAccountBalance()
      const bal = Number(recharge.overview.value?.balance || 0)
      state.setBalanceAvailable(bal)
    } catch {
      state.setBalanceAvailable(0)
    }
  }

  /** 创建订单并初始化支付信息 */
  const createOrderAndInitPay = async () => {
    if (!state.selectedRealNameId.value) {
      message.warning('请选择实名模板')
      return false
    }
    const cartIds = (state.cartListInfo.value.items || []).map(it => Number(it.id)).filter(Boolean) as number[]
    if (cartIds.length === 0) {
      message.warning('购物车为空')
      return false
    }
    try {
      state.setCheckoutLoading(true)
      const payload:CreateOrderRequest = {
        real_name_template_id: state.selectedRealNameId.value as number,
        order_type: 0,
        cart_ids: cartIds,
      }
			const { fetch, data } = createOrder(payload)
			await fetch()
			if (!data.value?.status) {
				message.error(data.value?.msg || '创建订单失败')
				return false;
			}
      const info = data.value?.data as CreateOrderPayInfo
      state.setOrderPayInfo(info)
      state.setCheckoutStep(2)
      // 扫码方式默认启动轮询
      if (state.payChannel.value !== 'balance' && info?.order_no) {
        startCheckoutPolling(info.order_no)
      }
      return true
    } catch {
      message.error('创建订单失败')
      return false
    } finally {
      state.setCheckoutLoading(false)
    }
  }

  /** 打开结算弹窗（步骤式） */
  const openCheckoutModal = async () => {
    state.resetCheckout()
    await Promise.all([loadRealNameOptions(), ensureBalance()])
    openCheckoutDialog.value = useModal({
      title: '结算',
      area: '420px',
      component: CheckoutDialog,
      componentProps: {},
      footer: false,
    })
	}
	/** 选择实名模板 */
	const handleSelectRealName = (val: number) => {
		if (val === -1) openCreateRealNameModal()
		else state.setSelectedRealNameId(val)
	}

  /** 创建实名模板窗口（步骤一入口中的快捷按钮） */
  const openCreateRealNameModal = () => {
    const modal = useModal({
      title: '创建实名模板',
      area: '1000px',
      component: DomainRegistrationForm,
      componentProps: { mode: 'add', refresh: async () => { await loadRealNameOptions() } },
      footer: false,
    })
    return modal
  }

  /**
   * 处理概览卡片点击
   * @param path 跳转路径
   */
  const handleCardClick = (path?: string): void => {
    if (path?.indexOf("https") === 0) {
      window.open(path, "_blank");
      return;
    }
    if (path) {
      router.push(path);
    }
  };

  /**
   * 处理快捷操作点击
   * @param action 快捷操作项
   */
  const handleActionClick = (action: QuickAction): void => {
    if (action.title == "注册域名") {
      window.open(action.path, "_blank");
      return;
    }
    router.push(action.path);
  };

  /**
   * 查看所有域名
   */
  const handleViewAllDomains = (): void => {
    router.push("/domain/list");
  };

  /**
   * 查看所有订单
   */
  const handleViewAllOrders = (): void => {
    router.push("/order");
  };

  // -------------------- 映射配置 --------------------

  // 使用全局常量配置
  const domainStatusMap = DOMAIN_STATUS_CONFIG;
  const orderTypeMap = ORDER_TYPE_CONFIG;
  const orderStatusMap = ORDER_STATUS_CONFIG;
  const notificationMap = NOTIFICATION_CONFIG;

  // -------------------- 获取函数 --------------------

  /**
   * 获取域名状态标签类型
   * @param status 域名状态
   */
  const getDomainStatusType = (
    status: DomainOverviewItem["status"],
  ): "success" | "warning" | "error" | "info" | "default" => {
    return domainStatusMap[status]?.type || "default";
  };

  /**
   * 获取域名状态文本
   * @param status 域名状态
   */
  const getDomainStatusText = (
    status: DomainOverviewItem["status"],
  ): string => {
    return domainStatusMap[status]?.text || "未知";
  };

  /**
   * 获取域名状态颜色
   * @param status 域名状态
   */
  const getDomainStatusColor = (
    status: DomainOverviewItem["status"],
  ): string => {
    return domainStatusMap[status]?.color || "#666666";
  };

  /**
   * 获取订单类型文本
   * @param type 订单类型
   */
  const getOrderTypeText = (type: OrderItem["type"]): string => {
    return orderTypeMap[type] || "未知";
  };

  /**
   * 获取订单状态标签类型
   * @param status 订单状态
   */
  const getOrderStatusType = (
    status: OrderItem["status"],
  ): "success" | "warning" | "error" | "default" => {
    return orderStatusMap[status]?.type || "default";
  };

  /**
   * 获取订单状态文本
   * @param status 订单状态
   */
  const getOrderStatusText = (status: OrderItem["status"]): string => {
    return orderStatusMap[status]?.text || "未知";
  };

  /**
   * 获取订单状态颜色
   * @param status 订单状态
   */
  const getOrderStatusColor = (status: OrderItem["status"]): string => {
    return orderStatusMap[status]?.color || "#666666";
  };

  /**
   * 获取通知图标
   * @param type 通知类型
   */
  const getNotificationIcon = (
    type: "info" | "success" | "warning" | "error",
  ) => {
    return notificationMap[type]?.icon || NOTIFICATION_CONFIG.info.icon;
  };

  /**
   * 获取通知图标颜色
   * @param type 通知类型
   */
  const getNotificationIconColor = (
    type: "info" | "success" | "warning" | "error",
  ): string => {
    return notificationMap[type]?.color || "#2080f0";
  };

  /** 启动支付轮询（购物车结算） */
  const startCheckoutPolling = (orderNo: string) => {
    if (!orderNo) return
    stopCheckoutPolling()
    let count = 0
    const maxCount = 60
    checkoutPollTimer = setInterval(async () => {
      count++
      try {
        const { fetch, data } = queryPaymentStatus({ order_no: orderNo })
        await fetch()
        const paid = Number(data.value?.data?.status ?? 0) === 1
        if (paid) {
          stopCheckoutPolling()
          message.success('支付成功')
          await loadCartList()
          await loadDashboardData()
          openCheckoutDialog.value?.close?.()
        } else if (count >= maxCount) {
          stopCheckoutPolling()
        }
      } catch {
        if (count >= maxCount) stopCheckoutPolling()
      }
    }, 3000)
  }

  /** 停止支付轮询 */
  const stopCheckoutPolling = () => {
    if (checkoutPollTimer) {
      clearInterval(checkoutPollTimer)
      checkoutPollTimer = null
    }
  }

  /** 切换支付方式：余额时停止轮询，扫码方式在有 order_no 且未轮询时重启 */
  const switchCheckoutPayChannel = (c: 'wechat' | 'alipay' | 'balance') => {
    state.setPayChannel(c)
    const orderNo = state.orderPayInfo.value?.order_no || ''
    if (c === 'balance') {
      stopCheckoutPolling()
      return
    }
    if (orderNo && !checkoutPollTimer) startCheckoutPolling(orderNo)
  }

  /** 余额支付 */
  const payCartByBalance = async () => {
    const info = state.orderPayInfo.value
    const orderNo = info?.order_no || ''
    if (!orderNo) {
      message.error('未找到订单号')
      return
    }
    const canPay = Number(state.balanceAvailable.value || 0) >= Number(info?.total_price || 0)
    if (!canPay) {
      message.warning('余额不足，请先充值')
      return
    }
    try {
      const { fetch, data } = buyByBalance({ order_no: orderNo })
      await fetch()
      if (!data.value?.status) {
        message.error(data.value?.msg || '支付失败')
        return
      }
      stopCheckoutPolling()
      message.success('支付成功')
      await loadCartList()
      await loadDashboardData()
      openCheckoutDialog.value?.close?.()
    } catch {
      message.error('支付异常')
    }
  }

  return {
		state,
		loadDashboardData,
		openCheckoutModal,
		createOrderAndInitPay,
		loadRealNameOptions,
		ensureBalance,
		openCreateRealNameModal,
		handleCardClick,
		handleActionClick,
		handleViewAllDomains,
		handleViewAllOrders,
		getDomainStatusType,
		getDomainStatusText,
		getDomainStatusColor,
		getOrderTypeText,
		getOrderStatusType,
		getOrderStatusText,
		getOrderStatusColor,
		getNotificationIcon,
		getNotificationIconColor,
		loadCartList,
		removeFromCart,
		updateCartYear,
		handleSelectRealName,
    switchCheckoutPayChannel,
    payCartByBalance,
	}
};
