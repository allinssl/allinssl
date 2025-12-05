/**
 * 模板 ID 常量（来自 `domain-registration.html` 中所有 `<script type="text/template">`）
 *
 * 使用建议：配合 `@types/template-data-map.d.ts` 的模块增强，
 * - `renderTemplate(TPL_EMPTY_STATE, { icon: '...', text: '...' })` 将获得强类型校验
 */
import type { TemplateDataMap } from "./template-data-map";

/**
 * 所有模板 ID 的联合类型
 */
export type TemplateId = keyof TemplateDataMap;

// 空状态与列表项
export const TPL_EMPTY_STATE = "empty-state-template" as const;
export const TPL_SEARCH_RESULT_ITEM = "search-result-item-template" as const;
export const TPL_VIEW_MORE_BUTTON = "view-more-button-template" as const;

// 购物车
export const TPL_CART_ITEM = "cart-item-template" as const;

// 模板选项
export const TPL_TEMPLATE_OPTION = "template-option-template" as const;
export const TPL_TEMPLATE_SELECT_OPTION =
  "template-select-option-template" as const;

// 模态框
export const TPL_MODAL_CONTAINER = "modal-container-template" as const;
export const TPL_MODAL_CONTENT = "modal-content-template" as const;
export const TPL_MODAL_BUTTON = "modal-button-template" as const;

// 通知
export const TPL_NOTIFICATION_CONTAINER =
  "notification-container-template" as const;
export const TPL_NOTIFICATION_CONTENT =
  "notification-content-template" as const;

// 购买弹窗（域名单项）
export const TPL_BUY_MODAL_TEMPLATE_SELECTOR =
  "buy-modal-template-selector-template" as const;
export const TPL_BUY_MODAL_PRICE_INFO =
  "buy-modal-price-info-template" as const;
export const TPL_BUY_MODAL_WARNING = "buy-modal-warning-template" as const;
export const TPL_BUY_MODAL_CONTENT = "buy-modal-content-template" as const;

// 支付弹窗 - 购物车项目与列表
export const TPL_PAYMENT_CART_ITEM = "payment-cart-item-template" as const;
export const TPL_PAYMENT_MODAL_CART_ITEMS =
  "payment-modal-cart-items-template" as const;
export const TPL_PAYMENT_MODAL_WARNING =
  "payment-modal-warning-template" as const;

// 支付方式/底部汇总
export const TPL_PAYMENT_MODAL_PAYMENT_SECTION =
  "payment-modal-payment-section-template" as const;

// 支付弹窗完整内容
export const TPL_PAYMENT_MODAL_CONTENT =
  "payment-modal-content-template" as const;

// 支付界面
export const TPL_PAYMENT_INTERFACE = "payment-interface-template" as const;

// 订单与支付结果
export const TPL_ORDER_ITEM = "order-item-template" as const;
export const TPL_ORDER_SUCCESS = "order-success-template" as const;

// 确认删除
export const TPL_CONFIRM_DELETE_MODAL =
  "confirm-delete-modal-template" as const;

/**
 * 模板常量字典，便于遍历或注入
 */
export const TEMPLATES = {
  TPL_EMPTY_STATE,
  TPL_SEARCH_RESULT_ITEM,
  TPL_VIEW_MORE_BUTTON,
  TPL_CART_ITEM,
  TPL_TEMPLATE_OPTION,
  TPL_TEMPLATE_SELECT_OPTION,
  TPL_MODAL_CONTAINER,
  TPL_MODAL_CONTENT,
  TPL_MODAL_BUTTON,
  TPL_NOTIFICATION_CONTAINER,
  TPL_NOTIFICATION_CONTENT,
  TPL_BUY_MODAL_TEMPLATE_SELECTOR,
  TPL_BUY_MODAL_PRICE_INFO,
  TPL_BUY_MODAL_WARNING,
  TPL_BUY_MODAL_CONTENT,
  TPL_PAYMENT_CART_ITEM,
  TPL_PAYMENT_MODAL_CART_ITEMS,
  TPL_PAYMENT_MODAL_WARNING,
  TPL_PAYMENT_MODAL_PAYMENT_SECTION,
  TPL_PAYMENT_MODAL_CONTENT,
  TPL_PAYMENT_INTERFACE,
  TPL_ORDER_ITEM,
  TPL_ORDER_SUCCESS,
  TPL_CONFIRM_DELETE_MODAL,
} as const;
