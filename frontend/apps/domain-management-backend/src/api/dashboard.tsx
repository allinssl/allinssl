/**
 * @fileoverview 仪表板相关 API 接口
 * @description 提供用户后台首页统计数据的获取功能
 */

import { useApi } from "@api/index";
import type {
	DashboardOverviewResponse,
	CartListResponse,
	RemoveCartItemResponse,
	RemoveCartItemRequest,
	CreateOrderRequest,
	CreateOrderResponse,
	UpdateCartRequest,
	UpdateCartResponse,
} from '@/types/dashboard'

/**
 * @description 获取用户后台首页统计数据
 * @description 包括域名状态统计、即将过期域名、待处理订单、最近订单等信息
 * @returns {useAxiosReturn<DashboardOverviewResponse, Record<string, unknown>>} 返回仪表板概览数据
 */
export const fetchDashboardOverview = () =>
  useApi<DashboardOverviewResponse>("/v1/domain/manage/dashboard_overview", {});

/**
 * @description 获取购物车列表
 */
export const fetchCartList = () => useApi<CartListResponse>("/v1/order/cart/list", {});

/**
 * @description 更新购物车年限
 */
export const updateCart = (params: UpdateCartRequest) =>
  useApi<UpdateCartResponse, UpdateCartRequest>("/v1/order/cart/update", params);

/**
 * @description 从购物车移除
 */
export const removeCartItem = (params: RemoveCartItemRequest) =>
  useApi<RemoveCartItemResponse, RemoveCartItemRequest>("/v1/order/cart/remove", params);

/**
 * @description 创建订单（根据购物车生成支付订单）
 */
export const createOrder = (params: CreateOrderRequest) =>
  useApi<CreateOrderResponse, CreateOrderRequest>(
    "/v1/order/create",
    params,
  );
