import api from "./index";
import type { ApiResponse } from "../types/api";

import type {
  DomainQueryCheckRequest,
  DomainQueryCheckResponseData,
} from "../types/api-types/domain-query-check";
import type {
  ContactGetUserDetailRequest,
  ContactGetUserDetailResponseData,
} from "../types/api-types/contact-get-user-detail";
import type {
  OrderCartListRequest,
  OrderCartListResponseData,
} from "../types/api-types/order-cart-list";
import type {
  OrderCartAddRequest,
  OrderCartAddResponseData,
} from "../types/api-types/order-cart-add";
import type {
  OrderCartUpdateRequest,
  OrderCartUpdateResponseData,
} from "../types/api-types/order-cart-update";
import type {
  OrderCartRemoveRequest,
  OrderCartRemoveResponseData,
} from "../types/api-types/order-cart-remove";
import type {
  OrderCartClearRequest,
  OrderCartClearResponseData,
} from "../types/api-types/order-cart-clear";
import type {
  OrderCreateRequest,
  OrderCreateResponseData,
} from "../types/api-types/order-create";
import type {
  OrderPaymentStatusRequest,
  OrderPaymentStatusResponseData,
} from "../types/api-types/order-payment-status";
import type {
  OrderDetailRequest,
  OrderDetailResponseData,
} from "../types/api-types/order-detail";

// 落地页-域名查询
export function domainQueryCheck(
  data: DomainQueryCheckRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<DomainQueryCheckResponseData>> {
  return api.post<DomainQueryCheckResponseData>(
    "/v1/domain/query/check",
    data,
    headers
  );
}

// 获取实名信息模板列表
export function getContactUserDetail(
  data: ContactGetUserDetailRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<ContactGetUserDetailResponseData>> {
  return api.post<ContactGetUserDetailResponseData>(
    "/v1/contact/get_user_detail",
    data,
    headers
  );
}

// 购物车：获取列表
export function getOrderCartList(
  data: OrderCartListRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<OrderCartListResponseData>> {
  return api.post<OrderCartListResponseData>(
    "/v1/order/cart/list",
    data,
    headers
  );
}

// 购物车：添加
export function addToCart(
  data: OrderCartAddRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<OrderCartAddResponseData>> {
  return api.post<OrderCartAddResponseData>(
    "/v1/order/cart/add",
    data,
    headers
  );
}

// 购物车：更新
export function updateCart(
  data: OrderCartUpdateRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<OrderCartUpdateResponseData>> {
  return api.post<OrderCartUpdateResponseData>(
    "/v1/order/cart/update",
    data,
    headers
  );
}

// 购物车：移除
export function removeFromCart(
  data: OrderCartRemoveRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<OrderCartRemoveResponseData>> {
  return api.post<OrderCartRemoveResponseData>(
    "/v1/order/cart/remove",
    data,
    headers
  );
}

// 购物车：清空
export function clearCart(
  data: OrderCartClearRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<OrderCartClearResponseData>> {
  return api.post<OrderCartClearResponseData>(
    "/v1/order/cart/clear",
    data,
    headers
  );
}

// 创建订单
export function createOrder(
  data: OrderCreateRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<OrderCreateResponseData>> {
  return api.post<OrderCreateResponseData>("/v1/order/create", data, headers);
}

// 查询支付状态
export function queryPaymentStatus(
  data: OrderPaymentStatusRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<OrderPaymentStatusResponseData>> {
  return api.post<OrderPaymentStatusResponseData>(
    "/v1/order/payment/status",
    data,
    headers
  );
}

// 获取指定订单的详细信息
export function getOrderDetail(
  data: OrderDetailRequest,
  headers?: Record<string, string>
): Promise<ApiResponse<OrderDetailResponseData>> {
  return api.post<OrderDetailResponseData>("/v1/order/detail", data, headers);
}

/**
 * WHOIS查询API
 * @param domain 域名
 * @returns Promise<ApiResponse<WhoisData>>
 */
export const queryWhois = (domain: string) => {
  return api.get(`/whois/query`, { domain });
};

export const landingApi = {
  domainQueryCheck,
  getContactUserDetail,
  getOrderCartList,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart,
  createOrder,
  queryPaymentStatus,
  getOrderDetail,
  queryWhois,
};

export default landingApi;
