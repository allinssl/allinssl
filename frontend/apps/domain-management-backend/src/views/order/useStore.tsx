/**
 * 订单管理页面状态管理
 * 负责管理订单数据、筛选条件、分页等状态
 * 所有映射内容已硬编码，不再依赖外部配置
 */

import { ref, computed } from "vue";
import { defineStore, storeToRefs } from "pinia";
import { fetchOrders, cancelOrder } from "@/api/order";
import { useError } from "@baota/hooks/error";

import type { TableResponse } from "@baota/naive-ui/types/table";
import type { OrderItem, FetchOrdersRequest } from "@/types/order";
import type { TagType, OrderOverviewStats, OverviewCard } from "./types.d";

const { handleError } = useError();

// -------------------- 硬编码常量定义 --------------------

/**
 * 订单状态常量
 */
const ORDER_STATUS = {
  /** 待处理 */
  PENDING: 0,
  /** 处理中 */
  PROCESSING: 1,
  /** 已完成 */
  COMPLETED: 2,
  /** 已取消 */
  CANCELLED: 3,
  /** 退款 */
  REFUNDING: 10,
};

/**
 * 订单类型常量
 */
const ORDER_TYPE = {
  /** 域名注册 */
  REGISTER: 0,
  /** 域名续费 */
  RENEW: 1,
  /** 域名转入 */
  TRANSFER: 2,
};

/**
 * 订单状态映射
 */
const ORDER_STATUS_MAP = {
  [ORDER_STATUS.PENDING]: {
    type: "warning" as TagType,
    text: "待处理",
    color: "#faad14",
  },
  [ORDER_STATUS.PROCESSING]: {
    type: "info" as TagType,
    text: "处理中",
    color: "#1890ff",
  },
  [ORDER_STATUS.COMPLETED]: {
    type: "success" as TagType,
    text: "已完成",
    color: "#52c41a",
  },
  [ORDER_STATUS.CANCELLED]: {
    type: "error" as TagType,
    text: "已取消",
    color: "#ff4d4f",
  },
  [ORDER_STATUS.REFUNDING]: {
    type: "warning" as TagType,
    text: "退款",
    color: "#faad14",
  },
  unknown: { type: "default" as TagType, text: "未知状态", color: "#666666" },
};

/**
 * 订单类型映射
 */
const ORDER_TYPE_MAP = {
  [ORDER_TYPE.REGISTER]: { text: "域名注册", color: "#1890ff" },
  [ORDER_TYPE.RENEW]: { text: "域名续费", color: "#52c41a" },
  [ORDER_TYPE.TRANSFER]: { text: "域名转入", color: "#722ed1" },
  unknown: { text: "未知类型", color: "#666666" },
};

/**
 * 订单状态选项
 */
const STATUS_OPTIONS = [
  { label: "全部状态", value: -1 },
  { label: "待处理", value: ORDER_STATUS.PENDING },
  { label: "处理中", value: ORDER_STATUS.PROCESSING },
  { label: "已完成", value: ORDER_STATUS.COMPLETED },
  { label: "已取消", value: ORDER_STATUS.CANCELLED },
  { label: "退款", value: ORDER_STATUS.REFUNDING },
];

/**
 * 订单类型选项
 */
const TYPE_OPTIONS = [
  { label: "全部类型", value: -1 },
  { label: "域名注册", value: ORDER_TYPE.REGISTER },
  { label: "域名续费", value: ORDER_TYPE.RENEW },
  { label: "域名转入", value: ORDER_TYPE.TRANSFER },
];

/**
 * 订单管理页面状态Store
 */
export const useOrderStore = defineStore("order-store", () => {
  // -------------------- 状态定义 --------------------

  /** 页面加载状态 */
  const loading = ref(false);

  /** 订单概览统计数据 */
  const overviewStats = ref<OrderOverviewStats>({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
  });

  // 统一的表单和表格数据源
  const fetchOrdersParms = ref<FetchOrdersRequest>({
    p: 1,
    rows: 10,
    order_no: "",
    order_type: -1,
    status: -1,
    start_time: 0,
    end_time: 0,
  });

  const dateTimeRange = ref<[number, number] | null>(null);

  /**
   * 概览卡片数据
   */
  const overviewCards = computed((): OverviewCard[] => [
    {
      title: "全部订单",
      icon: "ShoppingCart",
      color: "#1890ff",
      bgColor: "#e6f7ff",
      value: overviewStats.value.totalOrders,
      type: "total",
    },
    {
      title: "待处理",
      icon: "Clock",
      color: "#faad14",
      bgColor: "#fff7e6",
      value: overviewStats.value.pendingOrders,
      type: "pending",
    },
    {
      title: "已完成",
      icon: "CheckCircle",
      color: "#52c41a",
      bgColor: "#f6ffed",
      value: overviewStats.value.completedOrders,
      type: "completed",
    },
    {
      title: "已取消",
      icon: "XCircle",
      color: "#ff4d4f",
      bgColor: "#fff2f0",
      value: overviewStats.value.cancelledOrders,
      type: "cancelled",
    },
  ]);

  // -------------------- 工具方法定义 --------------------

  /**
   * 获取订单状态文本
   * @param status 状态值
   */
  const getOrderStatusText = (status: number | undefined): string =>
    ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP]?.text ??
    ORDER_STATUS_MAP.unknown.text;

  /**
   * 获取订单状态类型（用于NTag组件）
   * @param status 状态值
   */
  const getOrderStatusType = (status: number | undefined): TagType =>
    ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP]?.type ??
    ORDER_STATUS_MAP.unknown.type;

  /**
   * 获取订单状态颜色
   * @param status 状态值
   */
  const getOrderStatusColor = (status: number | undefined): string =>
    ORDER_STATUS_MAP[status as keyof typeof ORDER_STATUS_MAP]?.color ??
    ORDER_STATUS_MAP.unknown.color;

  /**
   * 获取订单类型文本
   * @param type 类型值
   */
  const getOrderTypeText = (type: number | undefined): string =>
    ORDER_TYPE_MAP[type as keyof typeof ORDER_TYPE_MAP]?.text ??
    ORDER_TYPE_MAP.unknown.text;

  /**
   * 获取订单类型颜色
   * @param type 类型值
   */
  const getOrderTypeColor = (type: number | undefined): string =>
    ORDER_TYPE_MAP[type as keyof typeof ORDER_TYPE_MAP]?.color ??
    ORDER_TYPE_MAP.unknown.color;

  // -------------------- 业务方法定义 --------------------

  /**
   * 获取订单列表数据
   * @param params 查询参数
   */
  const fetchOrderList = async <T = OrderItem,>(
    params: Partial<FetchOrdersRequest> = {},
  ): Promise<TableResponse<T>> => {
    try {
      loading.value = true;
      const response = await fetchOrders(params).fetch();
      const data = response.data;
      // 更新概览统计
      overviewStats.value = {
        totalOrders: data.total_orders,
        pendingOrders: data.pending_orders,
        completedOrders: data.finished_orders,
        cancelledOrders: data.cancelled_orders,
      };
      console.log({ list: data.data as T[], total: data.count });
      return { list: data.data as T[], total: data.count };
    } catch (error) {
      handleError(error);
      return { list: [] as T[], total: 0 };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 取消订单
   * @param orderId 订单ID
   * @param reason 取消原因
   */
  const cancelOrderById = async (orderId: number, reason: string) => {
    try {
      const { fetch, message } = cancelOrder({
        order_id: orderId,
        cancel_reason: reason,
      });
      message.value = true;
      await fetch();
    } catch (error) {
      handleError(error);
    }
  };

  // 返回状态和方法
  return {
    // 状态
    loading,
    overviewStats,
    overviewCards,
    fetchOrdersParms,
    dateTimeRange,

    // 工具方法
    getOrderStatusText,
    getOrderStatusType,
    getOrderStatusColor,
    getOrderTypeText,
    getOrderTypeColor,

    // 业务方法
    fetchOrderList,
    cancelOrderById,
  };
});

/**
 * 导出Store实例
 * 提供统一的状态和方法访问接口
 */
export const useOrderState = () => {
  const store = useOrderStore();
  return {
    ...store,
    ...storeToRefs(store),
  };
};

/**
 * 导出常量和工具方法
 * 方便在其他组件中直接使用
 */
export {
  ORDER_STATUS,
  ORDER_TYPE,
  ORDER_STATUS_MAP,
  ORDER_TYPE_MAP,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
};
