import api from "./index";
import type { ApiResponse } from "../types/api";

import type {
  DomainQueryCheckRequest,
  DomainQueryCheckResponseData,
  AiDomainQueryCheckRequest,
  AiDomainQueryCheckResponseData,
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
  AccountBalanceRequest,
  AccountBalanceResponseData,
  BalancePaymentRequest,
  BalancePaymentResponseData,
} from "../types/api-types/order-payment-status";
import type {
  OrderDetailRequest,
  OrderDetailResponseData,
} from "../types/api-types/order-detail";
import type {
  SeckillActivityInfoResponseData,
  GetActivityInfoRequest,
  GetActivityInfoResponseData,
  DomainSearchParams,
  DomainSearchData,
  CreateOrderParams,
  CreateOrderResponse,
  SeckillStatusParams,
  SeckillProcessingData,
  PaymentStatusParams,
  PaymentStatusData,
} from "../types/api-types/domain-flash";

// 落地页-域名查询
export function domainQueryCheck(
  data: DomainQueryCheckRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<DomainQueryCheckResponseData>> {
  return api.post<DomainQueryCheckResponseData>(
    "/v1/domain/query/check",
    data,
    headers,
  );
}
// AI -域名查询
export function aiDomainQueryCheck(
  data: AiDomainQueryCheckRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<AiDomainQueryCheckResponseData>> {
  return api.post<AiDomainQueryCheckResponseData>(
    "/v1/domain/recommend/recommend_domains",
    data,
    headers,
  );
}

// 获取实名信息模板列表
export function getContactUserDetail(
  data: ContactGetUserDetailRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<ContactGetUserDetailResponseData>> {
  return api.post<ContactGetUserDetailResponseData>(
    "/v1/contact/get_user_detail",
    data,
    headers,
  );
}

// 购物车：获取列表
export function getOrderCartList(
  data: OrderCartListRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<OrderCartListResponseData>> {
  return api.post<OrderCartListResponseData>(
    "/v1/order/cart/list",
    data,
    headers,
  );
}

// 购物车：添加
export function addToCart(
  data: OrderCartAddRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<OrderCartAddResponseData>> {
  return api.post<OrderCartAddResponseData>(
    "/v1/order/cart/add",
    data,
    headers,
  );
}

// 购物车：更新
export function updateCart(
  data: OrderCartUpdateRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<OrderCartUpdateResponseData>> {
  return api.post<OrderCartUpdateResponseData>(
    "/v1/order/cart/update",
    data,
    headers,
  );
}

// 购物车：移除
export function removeFromCart(
  data: OrderCartRemoveRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<OrderCartRemoveResponseData>> {
  return api.post<OrderCartRemoveResponseData>(
    "/v1/order/cart/remove",
    data,
    headers,
  );
}

// 购物车：清空
export function clearCart(
  data: OrderCartClearRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<OrderCartClearResponseData>> {
  return api.post<OrderCartClearResponseData>(
    "/v1/order/cart/clear",
    data,
    headers,
  );
}

// 创建订单
export function createOrder(
  data: OrderCreateRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<OrderCreateResponseData>> {
  return api.post<OrderCreateResponseData>("/v1/order/create", data, headers);
}

// 查询支付状态
export function queryPaymentStatus(
  data: OrderPaymentStatusRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<OrderPaymentStatusResponseData>> {
  return api.post<OrderPaymentStatusResponseData>(
    "/v1/order/payment/status",
    data,
    headers,
  );
}

// 获取指定订单的详细信息
export function getOrderDetail(
  data: OrderDetailRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<OrderDetailResponseData>> {
  return api.post<OrderDetailResponseData>("/v1/order/detail", data, headers);
}

// 获取账户余额
export function getAccountBalance(
  data: AccountBalanceRequest = {},
  headers?: Record<string, string>,
): Promise<ApiResponse<AccountBalanceResponseData>> {
  return api.post<AccountBalanceResponseData>(
    "/v1/order/buy/get_buy",
    data,
    headers,
  );
}

// 余额支付
export function payWithBalance(
  data: BalancePaymentRequest,
  headers?: Record<string, string>,
): Promise<ApiResponse<BalancePaymentResponseData>> {
  return api.post<BalancePaymentResponseData>(
    "/v1/order/buy/buy_payment",
    data,
    headers,
  );
}

// 获取今日秒杀活动信息
export function getSeckillActivityInfo(): Promise<
  ApiResponse<SeckillActivityInfoResponseData>
> {
  return api.post<SeckillActivityInfoResponseData>(
    "v1/user/flashsale/get_today_info",
    {},
  );
}
// 领取秒杀
export function grabSeckill(): Promise<ApiResponse> {
  return api.post("v1/user/flashsale/grab_coupon", {});
}

// 获取活动信息（域名/SSL 板块）
export function getActivityInfo(
  data: GetActivityInfoRequest = {},
): Promise<ApiResponse<GetActivityInfoResponseData>> {
  return api.post<GetActivityInfoResponseData>("/activity_info", data, {
    "X-API-BASE": "/newapi/activity/api",
  });
}

// 域名检索（可注册状态）
export function searchDomain(
  data: DomainSearchParams,
): Promise<ApiResponse<DomainSearchData>> {
  return api.post<DomainSearchData>("/domain/search", data, {
    "X-API-BASE": "/newapi/activity/api",
  });
}

// 创建订单（普通/秒杀，返回联合类型）
export function createFlashOrder(
  data: CreateOrderParams,
): Promise<ApiResponse<CreateOrderResponse>> {
  return api.post<CreateOrderResponse>("/order/create", data, {
    "X-API-BASE": "/newapi/activity/api",
  });
}

// 查询秒杀任务状态（轮询）
export function getSeckillStatus(
  data: SeckillStatusParams,
): Promise<ApiResponse<SeckillProcessingData>> {
  return api.post<SeckillProcessingData>("/order/seckill", data, {
    "X-API-BASE": "/newapi/activity/api",
  });
}

// 查询订单支付状态（轮询）
export function getPaymentStatus(
  data: PaymentStatusParams,
): Promise<ApiResponse<PaymentStatusData>> {
  return api.post<PaymentStatusData>("/order/payment_status", data, {
    "X-API-BASE": "/newapi/activity/api",
  });
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
  // 秒杀与活动相关
  getSeckillActivityInfo,
  grabSeckill,
  getActivityInfo,
  searchDomain,
  createFlashOrder,
  getSeckillStatus,
  getPaymentStatus,
};

export default landingApi;
