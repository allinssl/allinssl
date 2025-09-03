/**
 * 域名注册页：搜索 + 购物车 + 下单（函数式实现）
 *
 * 设计要点（WHY）：
 * - 统一全局 Store 管理领域状态，最小化 DOM 读写与"谁在改数据"的心智负担
 * - 渲染统一走模板引擎（见 domain-registration.html 中的 script 模板），降低耦合
 * - API 统一来自 @api/landing，保证接口与类型对齐
 * - 仅做"必要的交互"：查询、加入/移除购物车、清空、创建订单（支付简化为下单成功提示）
 */
import "virtual:uno.css";
import "../styles/index.css";

import {
  createStore,
  renderTemplate,
  renderTemplateList,
  formatPrice,
  formatPriceInteger,
  getUrlParam,
  updateUrlParam,
  ModalManager,
  NotificationManager,
  OverlayManager,
  calculateDropdownPosition,
  bindContactServicePopupClick,
} from "@utils";
import {
  TPL_SEARCH_RESULT_ITEM,
  TPL_EMPTY_STATE,
  TPL_CART_ITEM,
  TPL_TEMPLATE_SELECT_OPTION,
  TPL_VIEW_MORE_BUTTON,
  // 结算弹窗相关模板
  TPL_PAYMENT_CART_ITEM,
  TPL_PAYMENT_MODAL_CART_ITEMS,
  TPL_PAYMENT_MODAL_PAYMENT_SECTION,
  TPL_PAYMENT_MODAL_CONTENT,
  TPL_PAYMENT_MODAL_WARNING,
  // 支付界面/订单模板
  TPL_PAYMENT_INTERFACE,
  TPL_ORDER_ITEM,
  // 域名注册协议
  TPL_DOMAIN_AGREEMENT_MODAL,
  // WHOIS查询模态窗口
  TPL_WHOIS_MODAL,
} from "../templates";
import {
  domainQueryCheck,
  getOrderCartList,
  addToCart as apiAddToCart,
  updateCart as apiUpdateCart,
  removeFromCart as apiRemoveFromCart,
  clearCart as apiClearCart,
  createOrder as apiCreateOrder,
  queryPaymentStatus as apiQueryPaymentStatus,
  getContactUserDetail,
  getOrderDetail as apiGetOrderDetail,
} from "@api/landing";
import { queryWhois } from "@api/landing";

import type {
  DomainQueryCheckRequest,
  DomainQueryCheckResponseData,
} from "../types/api-types/domain-query-check";
import { Item } from "../types/api-types/order-cart-list";
import { Datum } from "../types/api-types/contact-get-user-detail";
import type { OrderCreateResponseData } from "../types/api-types/order-create";
import type { OrderDetailResponseData } from "../types/api-types/order-detail";

// ----------------------------
// 全局 Store（函数式）
// ----------------------------
/** 查询接口中单条域名项的结构（由 quicktype 生成） */
type DomainItem = DomainQueryCheckResponseData["data"][number];
/**
 * 轻量全局 Store 类型定义
 * - DomainStore: 维护查询入参与查询结果
 * - CartStore: 维护购物车条目与价格汇总（原价/应付）
 * - RealNameStore: 维护实名模板列表与当前选中模板
 */
type DomainStore = {
  input: string;
  param: DomainQueryCheckRequest;
  list: DomainItem[];
  page: number;
  hasMore: boolean;
};
type CartStore = { list: Item[]; originalTotal: number; payableTotal: number };
type RealNameStore = { list: Datum[]; current: Datum | null };

window.isLoggedIn = localStorage.getItem("isLogin") === "true";

// 定义全局状态-域名
// WHY: 使用 subscribe 监听 `param` 变化以触发查询，保持数据-视图解耦
const { state: domainState, subscribe: domainSubscribe } =
  createStore<DomainStore>({
    input: "",
    param: { domain: "", p: 1, rows: 20, recommend_type: -1 },
    list: [],
    page: 1,
    hasMore: false,
  });

// 定义全局状态-购物车
// WHY: 购物车列表通常在页面初始化拉取一次，后续交互再增量更新
const { state: cartState, subscribe: cartSubscribe } = createStore<CartStore>({
  list: [],
  originalTotal: 0,
  payableTotal: 0,
});

// 定义全局状态-实名认证
// WHY: 实名模板在"域名列表成功返回后"再拉取，避免无效请求
const { state: realNameState, subscribe: realNameSubscribe } =
  createStore<RealNameStore>({
    list: [],
    current: null,
  });

// ----------------------------
// 支付相关临时状态（模块级）
// ----------------------------
let currentOrderData: OrderCreateResponseData | null = null;
let currentOrderNo: string | null = null;
let paymentPollTimer: any = null;
let selectedPaymentMethod: "wechat" | "alipay" | "balance" = "wechat";
let successRedirectTimer: any = null;
let successRedirectCountdown = 5;

// 协议确认状态
let agreementAccepted = false;

// WHOIS模态窗口相关变量
let whoisModalInstance: any = null;

// ----------------------------
// 渲染与请求编排（subscribe）
// ----------------------------

function safe$() {
  return (window as any).$ as any;
}

function setHTML(selector: string, html: string) {
  const $ = safe$();
  if ($ && $(selector).length) {
    $(selector).html(html);
  }
}

function text(selector: string, value: string) {
  const $ = safe$();
  if ($ && $(selector).length) {
    $(selector).text(value);
  }
}

/**
 * 渲染域名列表
 * WHY: 对后端返回字段做展示层映射（价格/状态/格式化），与模板 `search-result-item-template` 对齐
 */
function renderDomainList(list: DomainItem[]) {
  const $ = safe$();

  // 如果列表为空，显示空状态容器
  if (!list || list.length === 0) {
    if ($) $("#empty-state-container").removeClass("hidden");
    return;
  }

  // 隐藏空状态容器
  if ($) {
    $("#empty-state-container").addClass("hidden");
  }

  // 根据购物车内容标记搜索结果中的已选中（已加入购物车）项
  const inCartDomainSet = new Set(
    (cartState.list || []).map((it: any) =>
      String(it.full_domain || it.domain_name || "")
    )
  );

  const mapped = list.map((it, index) => {
    const price =
      (it as any)?.price_info?.first_year_discount_price ??
      (it as any)?.price_info?.first_year_price;
    const originalPrice =
      (it as any)?.price_info?.renewal_discount_price ?? price;
    const renewPrice = (it as any)?.price_info?.renew_price;
    const renewPriceDiscount = (it as any)?.price_info?.renewal_discount_price;
    const isRegistered =
      it.status === "registered" ||
      (it as any).status_desc === "已注册" ||
      it.available === false;
    const fullDomain = it.domain;
    const type = (it as any)?.price_info?.recommend_type;
    const hasOriginalPrice = Number(originalPrice) > Number(price);
    const canShowTags = !isRegistered;
    const hasRecommended = canShowTags && type === 1;
    const hasPopular = canShowTags && type === 2;
    const hasDiscount = canShowTags && type === 3;
    const hasNew = canShowTags && type === 4;
    const discountPercent =
      canShowTags && hasOriginalPrice
        ? Math.round(
            ((Number(originalPrice) - Number(price)) / Number(originalPrice)) *
              100
          )
        : 0;
    return {
      domain: fullDomain,
      suffix: it.suffix,
      price,
      originalPrice,
      renewPrice: formatPrice(renewPrice),
      formattedPrice: formatPrice(price),
      formattedOriginalPrice: formatPrice(originalPrice),
      // SearchResultItem 需要的字段
      statusText: isRegistered
        ? String((it as any).status_desc || "已注册")
        : "",
      isRegistered,
      isLast: index === list.length - 1,
      // 选中（加入购物车）状态
      isInCart: inCartDomainSet.has(String(fullDomain)),
      // 便捷链接
      whoisUrl: `https://www.kenpai.com/whois/${fullDomain}`,
      hasRecommended,
      hasPopular,
      hasDiscount,
      hasOriginalPrice,
      discountPercent,
      hasNew,
      // 多年价格（首年按优惠价，续费按续费价）
      price3Years: formatPriceInteger(
        Number(price) + Number(renewPriceDiscount) * 2
      ),
      price5Years: formatPriceInteger(
        Number(price) + Number(renewPriceDiscount) * 4
      ),
      price10Years: formatPriceInteger(
        Number(price) + Number(renewPriceDiscount) * 9
      ),
      renewPrice3Years: formatPriceInteger(Number(renewPriceDiscount) * 3),
      renewPrice5Years: formatPriceInteger(Number(renewPriceDiscount) * 5),
      renewPrice10Years: formatPriceInteger(Number(renewPriceDiscount) * 10),
    };
  });

  const html = renderTemplate(TPL_SEARCH_RESULT_ITEM, { list: mapped });
  setHTML("#search-results", html);
  appendViewMore();
}

/**
 * 追加域名列表（查看更多）
 */
function appendDomainList(list: DomainItem[]) {
  const $ = safe$();
  if (!$) return;
  const inCartDomainSet = new Set(
    (cartState.list || []).map((it: any) =>
      String(it.full_domain || it.domain_name || "")
    )
  );
  const mapped = list.map((it, index) => {
    const price =
      (it as any)?.price_info?.first_year_discount_price ??
      (it as any)?.price_info?.first_year_price;
    const originalPrice =
      (it as any)?.price_info?.renewal_discount_price ?? price;
    const renewPrice = (it as any)?.price_info?.renewal_price;
    const renewPriceDiscount = (it as any)?.price_info?.renewal_discount_price;
    const isRegistered =
      it.status === "registered" ||
      (it as any).status_desc === "已注册" ||
      it.available === false;
    const fullDomain = it.domain;
    const type = (it as any)?.price_info?.recommend_type;
    const hasOriginalPrice = Number(originalPrice) > Number(price);
    const canShowTags = !isRegistered;
    const hasRecommended = canShowTags && type === 1;
    const hasPopular = canShowTags && type === 2;
    const hasDiscount = canShowTags && (type === 3 || hasOriginalPrice);
    const hasNew = canShowTags && type === 4;
    const discountPercent =
      canShowTags && hasOriginalPrice
        ? Math.round(
            ((Number(originalPrice) - Number(price)) / Number(originalPrice)) *
              100
          )
        : 0;
    return {
      domain: fullDomain,
      suffix: it.suffix,
      price,
      originalPrice,
      renewPrice,
      formattedPrice: formatPrice(price),
      formattedOriginalPrice: formatPrice(originalPrice),
      statusText: isRegistered
        ? String((it as any).status_desc || "已注册")
        : "",
      isRegistered,
      isLast: index === list.length - 1,
      isInCart: inCartDomainSet.has(String(fullDomain)),
      whoisUrl: `https://www.kenpai.com/whois/${fullDomain}`,
      hasRecommended,
      hasPopular,
      hasDiscount,
      hasOriginalPrice,
      discountPercent,
      hasNew,
      price3Years: formatPriceInteger(
        Number(price) + Number(renewPriceDiscount) * 2
      ),
      price5Years: formatPriceInteger(
        Number(price) + Number(renewPriceDiscount) * 4
      ),
      price10Years: formatPriceInteger(
        Number(price) + Number(renewPriceDiscount) * 9
      ),
      renewPrice3Years: formatPriceInteger(Number(renewPriceDiscount) * 3),
      renewPrice5Years: formatPriceInteger(Number(renewPriceDiscount) * 5),
      renewPrice10Years: formatPriceInteger(Number(renewPriceDiscount) * 10),
    };
  });
  const html = renderTemplate(TPL_SEARCH_RESULT_ITEM, { list: mapped });
  $("#search-results").append(html);
  appendViewMore();
}

function appendViewMore() {
  const $ = safe$();
  if (!$) return;
  // 移除旧的查看更多
  $("#show-more-button").closest("div").remove();
  if (domainState.hasMore) {
    const btn = renderTemplate(TPL_VIEW_MORE_BUTTON, {});
    // 需求：按钮追加到 #search-results 元素后面（作为其后一个兄弟元素）
    $("#search-results").after(btn);
  }
}

/**
 * 渲染购物车
 * WHY: 兼容不同字段（price/original_price 与 domain_service_price/full_domain），统一展示逻辑
 */
function renderCart(cart: CartStore) {
  const items = (cart.list || []) as any[];
  const $ = safe$();
  const $empty = $ && $("#empty-cart");
  const $filled = $ && $("#filled-cart");
  const $clearBtn = $ && $("#clear-cart-button");
  const $counter = $ && $(".cart-counter");

  if ($counter) $counter.text(String(items.length || 0));
  if (items.length === 0) {
    // 空态：显示空购物车区域，隐藏已填充区域与清空按钮
    if ($empty) $empty.removeClass("hidden");
    if ($filled) $filled.addClass("hidden");
    if ($clearBtn) $clearBtn.addClass("hidden");
    // 价格归零
    text("#cart-original-total", formatPrice(0));
    text("#cart-discount", `-${formatPrice(0)}`);
    text("#cart-payable", formatPrice(0));
    // 同步移动端购物车
    updateMobileCartBar({ list: [], originalTotal: 0, payableTotal: 0 });
    return;
  }

  const mapped = items.map((item, index) => {
    // 后端已按年限计算过汇总，这里价格用于单项展示，不乘年限
    const price = Number(
      item.total_price ?? item.price ?? item.domain_service_price ?? 0
    );
    const original = Number(item.original_price ?? price);
    return {
      ...item,
      index,
      domain: item.full_domain || item.domain_name,
      price,
      originalPrice: original,
      formattedPrice: formatPrice(price),
      formattedOriginalPrice: formatPrice(original),
    };
  });

  // 非空：显示已填充区域，隐藏空态，显示清空按钮
  if ($empty) $empty.addClass("hidden");
  if ($filled) $filled.removeClass("hidden");
  if ($clearBtn) $clearBtn.removeClass("hidden");

  setHTML("#cart-items", renderTemplateList(TPL_CART_ITEM, mapped));
  const originalTotal = (cart as any).originalTotal ?? 0;
  const payableTotal = (cart as any).payableTotal ?? 0;
  const discount = originalTotal - payableTotal;
  text("#cart-original-total", formatPrice(originalTotal));
  text("#cart-discount", `-${discount.toFixed(2)}`);
  text("#cart-payable", formatPrice(payableTotal));

  // 同步移动端购物车
  updateMobileCartBar(cart);
}

/**
 * 渲染实名模板下拉
 * WHY: 做脱敏/状态翻译/默认项标记，复用 `template-select-option-template`
 */
function renderRealNameTemplates(list: Datum[]) {
  const templates = (list || []).map((t) => {
    const displayName =
      t.template_name || t.owner_name || t.contact_person || "未知模板";
    const idMasked =
      t.id_number && t.id_number.length > 10
        ? t.id_number.replace(/(\d{6})\d{8}(\d{3}[0-9Xx])/, "$1****$2")
        : t.id_number;
    const status = (t as any).template_status || "";
    const statusMap: Record<string, { text: string; class: string }> = {
      draft: { text: "草稿", class: "text-gray-500" },
      pending: { text: "审核中", class: "text-yellow-600" },
      approved: { text: "已认证", class: "text-green-600" },
      rejected: { text: "认证失败", class: "text-red-600" },
      verified: { text: "已认证", class: "text-green-600" },
    };
    const statusView = statusMap[status] || {
      text: "",
      class: "text-gray-500",
    };
    return {
      ...(t as any),
      displayName,
      description: idMasked ? `证件：${idMasked}` : "",
      statusText: statusView.text,
      statusClass: statusView.class,
      isDefault: (t as any).is_default === 1,
    };
  });

  const html = renderTemplateList(TPL_TEMPLATE_SELECT_OPTION, templates);
  setHTML("#template-select", html);
}

/**
 * 拉取域名列表
 * NOTE: 使用 OverlayManager 显示局部加载；成功后写入 store 触发渲染与后续实名模板加载
 */
async function fetchDomainList(param: DomainQueryCheckRequest) {
  try {
    OverlayManager.showView?.("#search-results", { content: "正在搜索..." });
    const res = await domainQueryCheck(param);
    const data = res.data as any;
    const list: DomainItem[] = data?.data || [];
    const page = Number(data?.page || param.p || 1);
    const rows = Number(data?.row || param.rows || 20);
    // 简单判断是否还有更多：当次返回数量 >= rows 即认为可能还有下一页
    const hasMore = Array.isArray(list) && list.length >= rows;
    domainState.page = page;
    domainState.hasMore = hasMore;
    domainState.list = list;
  } catch (err: any) {
    console.error("域名查询失败", err);
    const { message } = err;
    setHTML(
      "#search-results",
      `<div class="text-center py-8 text-red-500">${message}</div>`
    );
  } finally {
    OverlayManager.hideView?.("#search-results");
  }
}

/**
 * 拉取购物车列表
 * WHY: 初始化阶段拉取一次，订阅负责后续渲染
 */
async function fetchCartList() {
  try {
    const res = await getOrderCartList({} as any);
    const data: any = res.data;
    cartState.list = data?.items || [];
    cartState.originalTotal = data?.original_price ?? 0;
    cartState.payableTotal = data?.total_price ?? 0;
  } catch (err) {
    console.error("获取购物车失败", err);
  }
}

/**
 * 计算选中购物车条目的总价信息
 */
function calculateSelectedTotals(items: any[]) {
  const safeItems = Array.isArray(items) ? items : [];
  // 注意：后端已按年限计算过条目价格（或提供 total_price），这里不再乘以 years
  const originalTotal = safeItems.reduce((sum, it: any) => {
    if (!it) return sum;
    const original = Number(
      it.original_price ??
        it.originalPrice ??
        it.price ??
        it.domain_service_price ??
        0
    );
    return sum + Math.max(0, original);
  }, 0);
  const payableTotal = safeItems.reduce((sum, it: any) => {
    if (!it) return sum;
    const value =
      it.total_price != null
        ? Number(it.total_price)
        : Number(it.price ?? it.domain_service_price ?? 0);
    return sum + Math.max(0, value);
  }, 0);
  const discount = Math.max(0, originalTotal - payableTotal);
  return {
    originalTotal: Math.round(originalTotal * 100) / 100,
    payableTotal: Math.round(payableTotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
  };
}

/**
 * 构建结算弹窗内容（参考旧版 search-cart.js 的显示方式）
 */
async function buildPaymentModalContent(init: boolean = true) {
  // 确保实名模板数据可用
  if (!Array.isArray(realNameState.list) || realNameState.list.length === 0) {
    await fetchRealNameList();
  }
  const template =
    (realNameState.current as any) ||
    (realNameState.list || [])[0] ||
    ({} as any);
  const templateName =
    template?.displayName ||
    template?.template_name ||
    template?.owner_name ||
    template?.contact_person ||
    "请选择实名模板";
  const idMasked = template?.id_number
    ? String(template.id_number).replace(
        /(\d{6})\d{8}(\d{3}[0-9Xx])/,
        "$1****$2"
      )
    : template?.id_number_masked || "";
  const selectedTemplateName = idMasked
    ? `${templateName} - ${idMasked}`
    : templateName;

  // 组装购物车条目（用于支付弹窗）
  const items = (cartState.list || []) as any[];
  const itemsWithFormatted = items.map((it: any, index: number) => {
    const years = Number(it.years || 1);
    const unitPrice = Number(it.price ?? it.domain_service_price ?? 0);
    const original = Number(it.original_price ?? unitPrice);

    return {
      index,
      selected: (it.selected ?? 1) !== 0,
      domain: String(it.full_domain || it.domain_name || ""),
      years,
      formattedTotalPrice: formatPrice(original),
      formattedUnitPrice: formatPrice(unitPrice),
    };
  });

  const cartItemsHtml = renderTemplate(TPL_PAYMENT_MODAL_CART_ITEMS, {
    totalItems: itemsWithFormatted.length,
    cartItemsHtml: renderTemplateList(
      TPL_PAYMENT_CART_ITEM,
      itemsWithFormatted
    ),
  });

  const totals = {
    // 直接使用后端已计算好的汇总
    originalTotal: Number(cartState.originalTotal ?? 0),
    payableTotal: Number(cartState.payableTotal ?? 0),
    discount: Math.max(
      0,
      Number(cartState.originalTotal ?? 0) - Number(cartState.payableTotal ?? 0)
    ),
  };

  const warningHtml = renderTemplate(TPL_PAYMENT_MODAL_WARNING, {});
  const paymentSectionHtml = renderTemplate(TPL_PAYMENT_MODAL_PAYMENT_SECTION, {
    selectedTemplateId: template?.id,
    selectedTemplateName,
    formattedOriginalTotal: formatPrice(totals.originalTotal),
    formattedDiscount: `¥${totals.discount.toFixed(2)}`,
    formattedPayableTotal: formatPrice(totals.payableTotal),
  });

  const content = renderTemplate(TPL_PAYMENT_MODAL_CONTENT, {
    warningHtml,
    cartItemsHtml,
    paymentSectionHtml,
  });
  return content;
}

/**
 * 打开购物车结算弹窗
 */
async function showPaymentModal() {
  const content = await buildPaymentModalContent(true);
  ModalManager.show?.({
    id: "cart-payment-modal",
    title: "购物车结算",
    content,
    size: "4xl",
    zIndex: 9999,
    className: "cart-payment-modal",
    closable: true,
    buttons: [],
    onShow: () => {
      const $ = safe$();
      if (!$) return;
      const $body = $("body");
      const prevOverflow = $body.css("overflow");
      const prevTouchAction = $body.css("touch-action");
      const prevOverscroll = $body.css("overscroll-behavior");
      $body.data("cartPaymentModalOverflow", prevOverflow);
      $body.data("cartPaymentModalTouchAction", prevTouchAction);
      $body.data("cartPaymentModalOverscroll", prevOverscroll);
      $body.css("overflow", "hidden");
      $body.css("touch-action", "none");
      $body.css("overscroll-behavior", "contain");
    },
    onHide: () => {
      const $ = safe$();
      if (!$) return;
      const $body = $("body");
      const prevOverflow = $body.data("cartPaymentModalOverflow");
      const prevTouchAction = $body.data("cartPaymentModalTouchAction");
      const prevOverscroll = $body.data("cartPaymentModalOverscroll");
      $body.css("overflow", prevOverflow || "");
      $body.css("touch-action", prevTouchAction || "");
      $body.css("overscroll-behavior", prevOverscroll || "");
      $body.removeData(
        "cartPaymentModalOverflow cartPaymentModalTouchAction cartPaymentModalOverscroll"
      );
    },
  });
  bindPaymentModalEvents();
  // 初始化"全选"为选中态
  const $ = safe$();
  if ($) {
    const $selectAll = $("#select-all-items");
    $selectAll.addClass("checked").data("selected", true);
    $(".item-checkbox").each(function (this: any) {
      const $item = $(this);
      $item.addClass("checked").data("selected", true);
    });
  }
}

/**
 * 构建订单项 HTML（用于支付界面左侧）
 */
function buildOrderItemsHtml(items: any[]) {
  const mapped = (items || []).map((it: any) => {
    const years = Math.max(1, Number(it.years || 1));
    // 注意：后端已给出总价（total_price 或等效字段），避免再次乘以 years
    const total = Number(
      it.total_price != null
        ? it.total_price
        : it.price != null
        ? it.price * years
        : it.domain_service_price != null
        ? it.domain_service_price * years
        : 0
    );
    const domain = String(it.full_domain || it.domain_name || "");
    const template = (realNameState.current as any) || {};
    const templateName =
      template?.displayName ||
      template?.template_name ||
      template?.owner_name ||
      template?.contact_person ||
      "请选择实名模板";
    return {
      domain,
      years,
      templateName,
      formattedTotalPrice: formatPrice(total),
    };
  });
  return renderTemplateList(TPL_ORDER_ITEM, mapped);
}

/**
 * 显示支付界面（不跳转外部支付页）
 */
function showPaymentInterface() {
  const $ = safe$();
  const selectedItems = (cartState.list || []).filter(
    (it: any) => (it.selected ?? 1) !== 0
  );
  if (selectedItems.length === 0) {
    NotificationManager.show?.({
      type: "warning",
      message: "请选择要购买的商品",
    });
    return;
  }

  const { originalTotal, payableTotal, discount } =
    calculateSelectedTotals(selectedItems);
  const hasDiscount = discount > 0;

  // 基础用户/余额信息（占位，实际可接入账户接口）
  const template = (realNameState.current as any) || {};
  const phone =
    template?.phone ||
    template?.owner_phone ||
    template?.contact_phone ||
    template?.contact_mobile ||
    "***";
  const userName = template?.owner_name || template?.contact_person || "用户";
  const userInitial = String(userName).trim().slice(0, 1) || "用";
  const accountBalance = 0; // TODO: 可接后端账户余额接口
  const remainingBalance = Math.max(0, accountBalance - payableTotal);
  const insufficientBalance = payableTotal > accountBalance;

  const content = renderTemplate(TPL_PAYMENT_INTERFACE, {
    orderItemsHtml: buildOrderItemsHtml(selectedItems),
    formattedOriginalTotal: formatPrice(originalTotal),
    formattedDiscount: formatPrice(discount),
    formattedPayableTotal: formatPrice(payableTotal),
    hasDiscount,
    accountBalance: formatPrice(accountBalance),
    remainingBalance: formatPrice(remainingBalance),
    insufficientBalance,
    userPhone: phone,
    userInitial,
    isWechatSelected: selectedPaymentMethod === "wechat",
    isAlipaySelected: selectedPaymentMethod === "alipay",
    isBalanceSelected: selectedPaymentMethod === "balance",
  });

  // 关闭结算弹窗，显示支付界面
  try {
    ModalManager.hide?.("cart-payment-modal");
  } catch {}

  ModalManager.show?.({
    id: "payment-interface-modal",
    title: "支付订单",
    content,
    size: "4xl",
    zIndex: 9999,
    className: "payment-interface-modal",
    closable: true,
    buttons: [],
    onShow: () => bindPaymentInterfaceEvents(),
    onHide: () => {
      // 关闭支付订单界面后，刷新购物车并清理轮询
      try {
        if (paymentPollTimer) clearInterval(paymentPollTimer);
        paymentPollTimer = null;
      } catch {}
      fetchCartList();
    },
  });

  // 初始显示二维码区域（微信）
  if ($) {
    if (selectedPaymentMethod === "balance") {
      $("#qr-code-section").addClass("hidden");
      $("#balance-payment-section").removeClass("hidden");
    } else if (selectedPaymentMethod === "alipay") {
      $("#balance-payment-section").addClass("hidden");
      $("#qr-code-section").removeClass("hidden");
      $("#qr-code-title").text("请使用支付宝扫码支付");
      $("#qr-code-tip").text("请在手机上打开支付宝，扫描上方二维码完成支付");
      generateQRCodeForSelectedMethod();
    } else {
      $("#balance-payment-section").addClass("hidden");
      $("#qr-code-section").removeClass("hidden");
      $("#qr-code-title").text("请使用微信扫码支付");
      $("#qr-code-tip").text("请在手机上打开微信，扫描上方二维码完成支付");
      generateQRCodeForSelectedMethod();
    }
    updateSegmentedSlider();
  }
}

/**
 * 绑定支付界面事件（方式切换等）
 */
function bindPaymentInterfaceEvents() {
  const $ = safe$();
  if (!$) return;

  $(document)
    .off("click", ".segmented-option")
    .on("click", ".segmented-option", function (this: any) {
      const $this = $(this);
      if ($this.hasClass("disabled")) return;
      const method = String($this.data("method") || "") as
        | "wechat"
        | "alipay"
        | "balance";
      // 切换 active 样式
      $this
        .closest(".segmented-control")
        .find(".segmented-option")
        .removeClass("active");
      $this.addClass("active");
      selectedPaymentMethod = method;

      if (method === "balance") {
        $("#qr-code-section").addClass("hidden");
        $("#balance-payment-section").removeClass("hidden");
      } else if (method === "wechat") {
        $("#balance-payment-section").addClass("hidden");
        $("#qr-code-section").removeClass("hidden");
        $("#qr-code-title").text("请使用微信扫码支付");
        $("#qr-code-tip").text("请在手机上打开微信，扫描上方二维码完成支付");
        generateQRCodeForSelectedMethod();
      } else if (method === "alipay") {
        $("#balance-payment-section").addClass("hidden");
        $("#qr-code-section").removeClass("hidden");
        $("#qr-code-title").text("请使用支付宝扫码支付");
        $("#qr-code-tip").text("请在手机上打开支付宝，扫描上方二维码完成支付");
        generateQRCodeForSelectedMethod();
      }
      updateSegmentedSlider();
    });

  // 余额确认支付
  $(document)
    .off("click", "#confirm-balance-payment-btn")
    .on("click", "#confirm-balance-payment-btn", async function () {
      if (selectedPaymentMethod !== "balance") return;
      if (!currentOrderNo && currentOrderData?.order_no)
        currentOrderNo = currentOrderData.order_no;
      if (!currentOrderNo) {
        NotificationManager.show?.({
          type: "error",
          message: "订单信息不存在，请返回重试",
        });
        return;
      }
      // 此处可接余额扣款接口；当前仅进行状态轮询
      startPaymentPolling();
    });
}

/**
 * 同步选中状态到状态树，并更新支付汇总
 */
function updateCartItemsSelectionFromDOM() {
  const $ = safe$();
  if (!$) return;
  const newList = (cartState.list || []).map((it: any, idx: number) => {
    const $checkbox = $(`.item-checkbox[data-index="${idx}"]`);
    const isSelected =
      $checkbox.data("selected") === "true" ||
      $checkbox.data("selected") === true ||
      $checkbox.hasClass("checked");
    return { ...it, selected: isSelected ? 1 : 0 };
  });
  cartState.list = newList as any;
  const hasSelected = newList.some((it: any) => (it.selected ?? 1) !== 0);
  $("#delete-selected-link").toggleClass("hidden", !hasSelected);
  updatePaymentSummary();
}

/**
 * 更新支付汇总信息（基于选中项）
 */
function updatePaymentSummary() {
  const $ = safe$();
  if (!$) return;
  const selected = (cartState.list || []).filter(
    (it: any) => (it.selected ?? 1) !== 0
  );
  const { originalTotal, payableTotal, discount } =
    calculateSelectedTotals(selected);

  $("#cart-payment-modal .payment-section .line-through").text(
    formatPrice(originalTotal)
  );
  $("#cart-payment-modal .payment-section .text-green-600").text(
    `-${formatPrice(discount)}`
  );
  $("#cart-payment-modal .payment-section .text-orange-500.font-bold").text(
    formatPrice(payableTotal)
  );

  $("#delete-selected-link").toggleClass("hidden", !selected.length);
  const $paymentBtn = $("#confirm-payment-btn");
  if (payableTotal > 0 && selected.length > 0) {
    $paymentBtn.prop("disabled", false).text("立即支付");
  } else {
    $paymentBtn.prop("disabled", true).text("请选择商品");
  }
  $(".checkbox-label").text(`全选 (${selected.length} 件商品)`);

  // 同步"全选"复选框状态（根据当前弹窗内条目选中情况）
  const total = $("#cart-payment-modal .item-checkbox").length;
  const checked = $("#cart-payment-modal .item-checkbox.checked").length;
  const $all = $("#select-all-items");
  if (total > 0 && checked === total) {
    $all
      .addClass("checked")
      .removeClass("indeterminate")
      .data("selected", true);
  } else if (checked === 0) {
    $all.removeClass("checked indeterminate").data("selected", false);
  } else if (total > 0) {
    $all
      .removeClass("checked")
      .addClass("indeterminate")
      .data("selected", false);
  }
}

/**
 * 绑定结算弹窗内事件
 */
function bindPaymentModalEvents() {
  const $ = safe$();
  if (!$) return;

  // 全选/取消全选
  $(document)
    .off("click", "#select-all-items")
    .on("click", "#select-all-items", function (this: any) {
      const $this = $(this);
      const isSelected =
        $this.data("selected") === "true" || $this.data("selected") === true;
      const newState = !isSelected;
      $this.data("selected", newState);
      if (newState) $this.addClass("checked");
      else $this.removeClass("checked");
      $(".item-checkbox").each(function (this: any) {
        const $item = $(this);
        $item.data("selected", newState);
        if (newState) $item.addClass("checked");
        else $item.removeClass("checked");
      });
      updateCartItemsSelectionFromDOM();
    });

  // 单个商品选择
  $(document)
    .off("click", ".item-checkbox")
    .on("click", ".item-checkbox", function (this: any) {
      const $this = $(this);
      const isSelected =
        $this.data("selected") === "true" || $this.data("selected") === true;
      const newState = !isSelected;
      $this.data("selected", newState);
      if (newState) $this.addClass("checked");
      else $this.removeClass("checked");
      // 同步"全选"态
      const total = $(".item-checkbox").length;
      const checked = $(".item-checkbox.checked").length;
      const $all = $("#select-all-items");
      if (checked === total) {
        $all
          .addClass("checked")
          .removeClass("indeterminate")
          .data("selected", true);
      } else if (checked === 0) {
        $all.removeClass("checked indeterminate").data("selected", false);
      } else {
        $all
          .removeClass("checked")
          .addClass("indeterminate")
          .data("selected", false);
      }
      updateCartItemsSelectionFromDOM();
    });

  // 删除单个条目（弹窗内）
  $(document)
    .off("click", ".delete-item-btn")
    .on("click", ".delete-item-btn", async function (this: any) {
      const $btn = $(this);
      const index = Number($btn.data("index"));
      const item = (cartState.list || [])[index] as any;
      if (!item) return;
      try {
        $btn.prop("disabled", true);
        OverlayManager.showGlobal?.({ content: "移除中..." });
        await apiRemoveFromCart({ cart_id: Number(item.id) });
        await fetchCartList();
        // 重建弹窗内容
        const html = await buildPaymentModalContent(false);
        $("#cart-payment-modal .modal-body-content").html(html);
        updatePaymentSummary();
      } catch (err) {
        console.error("移除失败", err);
        NotificationManager.show?.({
          type: "error",
          message: "移除失败，请重试",
        });
      } finally {
        $btn.prop("disabled", false);
        OverlayManager.hideGlobal?.();
      }
    });

  // 确认支付 -> 创建订单并跳转支付
  $(document)
    .off("click", "#confirm-payment-btn")
    .on("click", "#confirm-payment-btn", async function () {
      const selectedItems = (cartState.list || []).filter(
        (it: any) => (it.selected ?? 1) !== 0
      );

      if (selectedItems.length === 0) {
        NotificationManager.show?.({
          type: "warning",
          message: "请选择要购买的商品",
          zIndex: 9999,
        });
        return;
      }

      const template = realNameState.current as any;
      if (!template || !template.id) {
        NotificationManager.show?.({
          type: "warning",
          message: "请先选择实名模板",
          zIndex: 9999,
        });
        return;
      }

      if (!agreementAccepted) {
        NotificationManager.show?.({
          type: "warning",
          message: "请先勾选并同意域名注册协议",
          zIndex: 9999,
        });
        return;
      }

      // 对接创建订单接口，保留订单号与支付链接
      try {
        OverlayManager.showGlobal?.({ content: "创建订单中..." });
        const cartIds = selectedItems.map((it: any) => Number(it.id));
        const res = await apiCreateOrder({
          real_name_template_id: Number(template.id),
          order_type: 0,
          cart_ids: cartIds,
        });
        const data = (res?.data || {}) as OrderCreateResponseData;
        currentOrderData = data;
        currentOrderNo = data?.order_no || null;
      } catch (err) {
        NotificationManager.show?.({
          type: "error",
          message: (err as any)?.message,
          zIndex: 9999,
        });
        return;
      } finally {
        OverlayManager.hideGlobal?.();
      }

      // 展示站内支付界面
      showPaymentInterface();
    });

  // 年限选择（弹窗内）
  $(document)
    .off("click", ".cart-payment-modal .year-selector .select-display")
    .on(
      "click",
      ".cart-payment-modal .year-selector .select-display",
      function (this: any, e: any) {
        e?.stopPropagation?.();
        const $selector = $(this).closest(".year-selector");
        // 移除之前遗留的菜单，避免重复创建与内存泄漏
        $("body .year-select-menu").remove();

        let $menu = $selector.find(".select-menu");
        if (!$menu.length) {
          $menu = $('<div class="select-menu"></div>');
          const options = [1, 2, 3, 5, 10];
          const html = options
            .map(
              (y) => `<div class="select-option" data-value="${y}">${y}年</div>`
            )
            .join("");
          $menu.html(html);
          $("body").append($menu);
        }

        // 高亮当前选中年限
        const index = Number($selector.data("index"));
        const item = (cartState.list || [])[index] as any;
        const currentYears = Number(
          item?.years || $selector.data("value") || 1
        );
        $menu
          .find(`.select-option[data-value="${currentYears}"]`)
          .addClass("active bg-primary-10 text-primary");

        const pos = calculateDropdownPosition($selector, $menu);
        $menu.css({
          position: "fixed",
          top: pos.top,
          left: pos.left,
          maxHeight: pos.maxHeight,
          overflow: "auto",
          zIndex: 9999,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: "6px",
          padding: "6px 0",
          minWidth: Math.max(80, $selector.outerWidth?.() || 80),
        });
        $menu.show();

        const onDoc = (evt: any) => {
          if (!$(evt.target).closest(".select-menu, .year-selector").length) {
            $(document).off("click", onDoc);
            $menu.remove();
          }
        };
        setTimeout(() => $(document).on("click", onDoc), 0);

        $menu
          .off("click", ".select-option")
          .on("click", ".select-option", async function (this: any) {
            const years = Number($(this).data("value"));
            const index = Number($selector.data("index"));
            const item = (cartState.list || [])[index] as any;
            if (!item) return;
            try {
              await apiUpdateCart({
                cart_id: Number(item.id),
                years,
                is_selected: Number(item.selected ?? 1),
              });
              await fetchCartList();
              const html = await buildPaymentModalContent(false);
              $("#cart-payment-modal .modal-body-content").html(html);
              updatePaymentSummary();
            } catch (err) {
              console.error("年限更新失败", err);
              NotificationManager.show?.({
                type: "error",
                message: "年限更新失败，请重试",
                zIndex: 9999,
              });
            } finally {
              $menu.hide();
            }
          });
      }
    );

  // 实名模板选择（弹窗内）
  $(document)
    .off(
      "click",
      ".cart-payment-modal .real-name-template-selector .select-display"
    )
    .on(
      "click",
      ".cart-payment-modal .real-name-template-selector .select-display",
      function (this: any, e: any) {
        e?.stopPropagation?.();
        // 移除之前遗留的菜单，避免重复创建与内存泄漏
        $("body .real-name-menu").remove();

        const $selector = $(this).closest(".real-name-template-selector");
        let $menu = $('<div class="select-menu real-name-menu"></div>');
        const templates = (realNameState.list || []) as any[];
        const html = templates
          .map((t) => {
            const id = t.id;
            const name =
              t.template_name || t.owner_name || t.contact_person || "未知模板";
            const desc =
              t.id_number_masked ||
              t.id_number.replace(/(\d{6})\d{8}(\d{3}[0-9Xx])/, "$1****$2") ||
              "";

            return `<div class=\"select-option\" data-id=\"${id}\">${name}${
              desc ? " - " + desc : ""
            }</div>`;
          })
          .join("");
        const createItem = `
					<div class=\"select-divider\" style=\"margin:6px 0;border-top:1px solid #eee;\"></div>
					<div class=\"select-option select-create\" data-action=\"create\">+ 创建实名模板</div>
				`;
        $menu.html(html + createItem);
        $("body").append($menu);

        const pos = calculateDropdownPosition($selector, $menu);
        $menu.css({
          position: "fixed",
          top: pos.top,
          left: pos.left,
          maxHeight: pos.maxHeight,
          overflow: "auto",
          zIndex: 9999,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: "6px",
          padding: "6px 0",
          minWidth: Math.max(160, $selector.outerWidth?.() || 160),
        });
        $menu.show();
        // 高亮当前选中的模板
        const currentTemplate = realNameState.current as any;
        if (currentTemplate) {
          $menu
            .find(`.select-option[data-id="${currentTemplate.id}"]`)
            .addClass("active bg-primary-10 text-primary");
        }

        try {
          const anchorRect = ($selector[0] as any)?.getBoundingClientRect?.();
          const menuRect = ($menu[0] as any)?.getBoundingClientRect?.();
          if (anchorRect && menuRect) {
            const isAbove = menuRect.top < anchorRect.top;
            if (isAbove) {
              const newTop = Math.max(0, anchorRect.top - menuRect.height - 10);
              $menu.css({ top: newTop });
            }
          }
        } catch {}

        const onDoc = (evt: any) => {
          if (
            !$(evt.target).closest(".select-menu, .real-name-template-selector")
              .length
          ) {
            $menu.remove();
            $(document).off("click", onDoc);
          }
        };
        setTimeout(() => $(document).on("click", onDoc), 0);

        $menu
          .off("click", ".select-option")
          .on("click", ".select-option", function (this: any, evt: any) {
            const $opt = $(this);
            const action = String($opt.data("action") || "");
            if (action === "create") {
              evt?.preventDefault?.();
              window.open("https://www.bt.cn/domain/real-name", "_blank");
              $menu.hide();
              return;
            }
            const id = Number($opt.data("id"));
            const templates = (realNameState.list || []) as any[];
            const found = templates.find((t) => Number(t.id) === id) || null;
            if (found) {
              realNameState.current = found as any;
              const name =
                found.template_name ||
                found.owner_name ||
                found.contact_person ||
                "请选择实名模板";
              const desc =
                found.id_number_masked ||
                found.id_number.replace(
                  /(\d{6})\d{8}(\d{3}[0-9Xx])/,
                  "$1****$2"
                ) ||
                "";
              $selector
                .find(".select-text")
                .text(desc ? `${name} - ${desc}` : name);
            }
            $menu.remove();
          });
      }
    );

  // 批量删除选中（弹窗内）
  $(document)
    .off("click", "#delete-selected-link")
    .on("click", "#delete-selected-link", async function (e: any) {
      e.preventDefault();
      const selectedItems = (cartState.list || []).filter(
        (it: any) => (it.selected ?? 1) !== 0
      );
      if (selectedItems.length === 0) {
        NotificationManager.show?.({
          type: "warning",
          message: "请先选择要删除的商品",
        });
        return;
      }
      try {
        OverlayManager.showGlobal?.({ content: "正在删除选中商品..." });
        for (const it of selectedItems) {
          if (it && it.id != null) {
            await apiRemoveFromCart({ cart_id: Number(it.id) });
          }
        }
        await fetchCartList();
        const html = await buildPaymentModalContent(false);
        $("#cart-payment-modal .modal-body-content").html(html);
        updatePaymentSummary();
        NotificationManager.show?.({
          type: "success",
          message: `已删除 ${selectedItems.length} 件商品`,
          zIndex: 9999,
        });
      } catch (err) {
        console.error("批量删除失败", err);
        NotificationManager.show?.({
          type: "error",
          message: "删除失败，请重试",
          zIndex: 9999,
        });
      } finally {
        OverlayManager.hideGlobal?.();
      }
    });

  // 协议确认复选框点击事件
  $(document)
    .off("click", "#agreement-checkbox")
    .on("click", "#agreement-checkbox", function (this: any) {
      const $this = $(this);
      const $icon = $this.find(".custom-checkbox .checkbox-icon");
      const isChecked = $this.find(".custom-checkbox").hasClass("checked");

      if (isChecked) {
        // 取消勾选
        $this.find(".custom-checkbox").removeClass("checked");
        $icon.hide();
        agreementAccepted = false;
        updatePaymentButtonState();
      } else {
        // 勾选并显示协议模态窗口
        showDomainAgreementModal();
      }
    });

  // 协议链接点击事件
  $(document)
    .off("click", "#agreement-link")
    .on("click", "#agreement-link", function (e: any) {
      e.preventDefault();
      e.stopPropagation();
      showDomainAgreementModal();
    });

  // 根据当前订单数据生成二维码（若有）
  // 初始化 slider 位置
  updateSegmentedSlider();
}

/**
 * 基于 currentOrderData 和所选支付方式，生成或更新二维码
 */
function generateQRCodeForSelectedMethod() {
  const $ = safe$();
  if (!$) return;
  if (!currentOrderData) return;

  const method = selectedPaymentMethod;
  const $qrPlaceholder = $("#qr-code-placeholder");
  const $qrImage = $("#qr-code-image");

  try {
    let qrText = "";
    if (method === "wechat")
      qrText = currentOrderData.wx || currentOrderData.payment_url || "";
    if (method === "alipay")
      qrText = currentOrderData.ali || currentOrderData.payment_url || "";
    if (!qrText) return;

    $qrImage.empty();
    const $qr = $("<div>").css({ width: 180, height: 180, margin: "0 auto" });
    // 需要 jquery.qrcode 插件；若无则使用简单降级
    if (typeof ($qr as any).qrcode === "function") {
      ($qr as any).qrcode({ text: qrText, width: 180, height: 180 });
    } else {
      $qr.append(
        `<div class="w-180 h-180 flex items-center justify-center text-xs text-gray-500">二维码插件缺失，显示链接：${qrText}</div>`
      );
    }
    $qrImage.append($qr);
    $qrPlaceholder.hide();
    $qrImage.show();
    // 开始轮询支付状态
    startPaymentPolling();
  } catch (err) {
    console.error("生成二维码失败", err);
  }
}

/** 开始轮询支付状态 */
function startPaymentPolling() {
  if (paymentPollTimer) clearInterval(paymentPollTimer);
  const orderNo = currentOrderNo || currentOrderData?.order_no;
  if (!orderNo) return;
  let count = 0;
  const maxCount = 60;
  paymentPollTimer = setInterval(async () => {
    count++;
    try {
      const res = await apiQueryPaymentStatus({
        order_no: String(orderNo),
      } as any);
      const status = (res?.data as any)?.status;
      if (status === 1) {
        clearInterval(paymentPollTimer);
        paymentPollTimer = null;
        handlePaymentSuccess();
      }
      if (count >= maxCount) {
        clearInterval(paymentPollTimer);
        paymentPollTimer = null;
      }
    } catch (err) {
      if (count >= maxCount) {
        clearInterval(paymentPollTimer);
        paymentPollTimer = null;
      }
    }
  }, 5000);
}

function handlePaymentSuccess() {
  const $ = safe$();
  if (!$) return;
  try {
    ModalManager.hide?.("payment-interface-modal");
  } catch {}
  showPaymentSuccess();
}

/** 显示支付完成界面 */
async function showPaymentSuccess() {
  const orderNo = currentOrderNo || currentOrderData?.order_no;
  let detail: OrderDetailResponseData | null = null;
  try {
    if (orderNo) {
      const res = await apiGetOrderDetail({ order_no: String(orderNo) } as any);
      detail = (res?.data || null) as any;
    }
  } catch {}

  const items = detail?.items || [];
  const domains = items.map((it) => ({
    domain: it.full_domain || `${it.domain_name}.${it.suffix || ""}`,
    years: it.years || 1,
    templateName: realNameState.current?.template_name,
    formattedPrice: formatPrice(
      Number(it.total_amount || it.discount_price || it.one_price || 0)
    ),
  }));

  const formattedOriginalTotal = detail?.original_price
    ? String(detail.original_price)
    : formatPrice(0);
  const formattedPayableTotal = detail?.total_amount
    ? String(detail.total_amount)
    : formatPrice(0);
  const discountNumber = Math.max(
    0,
    Number(formattedOriginalTotal) - Number(formattedPayableTotal)
  );

  const successHtml = renderTemplate("order-success-template", {
    orderNumber: orderNo || "",
    domains,
    formattedOriginalTotal,
    hasDiscount: discountNumber > 0,
    formattedDiscount: `¥${discountNumber.toFixed(2)}`,
    formattedPayableTotal,
    paymentMethod:
      selectedPaymentMethod === "balance"
        ? "余额支付"
        : selectedPaymentMethod === "alipay"
        ? "支付宝"
        : "微信",
    paymentTime: new Date().toLocaleString(),
    transactionId: (currentOrderData as any)?.order_no || "",
  });

  ModalManager.show?.({
    id: "order-success-modal",
    title: "支付成功",
    content: successHtml,
    size: "2xl",
    zIndex: 9999,
    className: "order-success-modal",
    closable: true,
    buttons: [],
    onShow: () => {
      const $ = safe$();
      if (!$) return;
      // 初始化倒计时
      try {
        successRedirectCountdown = 5;
        const $count = $("#success-countdown");
        $count.text(String(successRedirectCountdown));
        if (successRedirectTimer) clearInterval(successRedirectTimer);
        successRedirectTimer = setInterval(() => {
          successRedirectCountdown = Math.max(0, successRedirectCountdown - 1);
          $count.text(String(successRedirectCountdown));
          if (successRedirectCountdown <= 0) {
            clearInterval(successRedirectTimer);
            successRedirectTimer = null;
            const a = document.createElement("a");
            a.href = "https://www.bt.cn/domain/dashboard";
            a.target = "_blank";
            a.click();
          }
        }, 1000);
      } catch {}

      // 立即跳转
      $(document)
        .off("click", "#success-jump-now")
        .on("click", "#success-jump-now", function (e: any) {
          e?.preventDefault?.();
          try {
            if (successRedirectTimer) clearInterval(successRedirectTimer);
            successRedirectTimer = null;
          } catch {}
          window.open("https://www.bt.cn/domain/dashboard", "_blank");
        });
    },
    onHide: () => {
      try {
        if (successRedirectTimer) clearInterval(successRedirectTimer);
        successRedirectTimer = null;
      } catch {}
    },
  });
}

/** 更新分段 slider 位置 */
function updateSegmentedSlider() {
  const $ = safe$();
  if (!$) return;
  const $control = $(".segmented-control");
  const $active = $control.find(".segmented-option.active");
  const $slider = $control.find(".segmented-slider");
  if (!$active.length || !$slider.length) return;
  const offsetLeft = ($active as any).position()?.left || 0;
  const width = ($active as any).outerWidth?.() || 0;
  $slider.css({
    width: `${width}px`,
    transform: `translateX(${offsetLeft}px)`,
  });
}

/**
 * 拉取实名模板列表
 * WHY: 仅在域名列表更新后触发，默认选择"已认证/默认模板"
 */
async function fetchRealNameList() {
  try {
    const res = await getContactUserDetail({ p: 1, rows: 100, status: 2 });
    realNameState.list = (res.data as any)?.data || [];
    const first =
      realNameState.list.find(
        (t) =>
          (t as any).template_status === "approved" || (t as any).status === 1
      ) || null;
    realNameState.current = first || realNameState.list[0] || null;
  } catch (err) {
    console.error("获取实名模板失败", err);
  }
}

/**
 * 更新支付按钮状态
 * WHY: 根据协议确认状态控制支付按钮的可用性
 */
function updatePaymentButtonState() {
  const $ = safe$();
  if (!$) return;

  const $paymentBtn = $("#confirm-payment-btn");

  if (agreementAccepted) {
    $paymentBtn
      .removeClass("opacity-50 cursor-not-allowed")
      .prop("disabled", false);
  } else {
    $paymentBtn
      .addClass("opacity-50 cursor-not-allowed")
      .prop("disabled", true);
  }
}

/**
 * 显示域名注册协议模态窗口
 * WHY: 当用户点击协议链接时显示详细的注册注意事项
 */
function showDomainAgreementModal() {
  const content = renderTemplate(TPL_DOMAIN_AGREEMENT_MODAL, {});
  ModalManager.show?.({
    id: "domain-agreement-modal",
    title: "",
    content,
    size: "2xl",
    zIndex: 10000,
    className: "domain-agreement-modal",
    closable: true,
    buttons: [],
    onShow: () => {
      const $ = safe$();
      if (!$) return;

      // 绑定模态窗口内的按钮事件
      $("#agreement-modal-close")
        .off("click")
        .on("click", () => {
          ModalManager.hide?.("domain-agreement-modal");
        });

      $("#agreement-modal-confirm")
        .off("click")
        .on("click", () => {
          // 用户点击"同意并继续"时，自动勾选协议复选框
          agreementAccepted = true;
          const $checkbox = $("#agreement-checkbox");
          const $icon = $checkbox.find(" .custom-checkbox .checkbox-icon");
          if ($checkbox.length) {
            $checkbox.find(".custom-checkbox").addClass("checked");
            $icon.show();
          }
          updatePaymentButtonState();
          ModalManager.hide?.("domain-agreement-modal");

          // 显示成功提示
          NotificationManager.show?.({
            type: "success",
            message: "已确认同意域名注册协议",
            duration: 2000,
          });
        });
    },
  });
}

/**
 * 显示WHOIS查询模态窗口
 * @param domain 要查询的域名
 */
async function showWhoisModal(domain: string) {
  const $ = safe$();
  if (!$) return;

  // 初始状态：显示加载中
  const initialData = {
    domain,
    isLoading: true,
    hasError: false,
    errorMessage: "",
    hasData: false,
    domainName: "",
    status: "",
    statusClass: "",
    registrar: "",
    creationDate: "",
    expirationDate: "",
    updatedDate: "",
    registrant: "",
    registrarName: "",
    emails: "",
    nameServers: [],
    rawData: "",
  };

  const modalHtml = renderTemplate(TPL_WHOIS_MODAL, initialData);
  const modalId = "whois-modal";

  // 显示模态窗口
  ModalManager.show({
    id: modalId,
    size: "2xl",
    title: `<i class="fa fa-search text-primary-500 mr-2"></i><span>WHOIS查询结果 - ${domain}</span>`,
    zIndex: 999,
    content: modalHtml,
    onShow: () => {
      bindWhoisModalEvents();
      // 开始查询WHOIS信息
      queryWhoisData(domain);
    },
    onHide: () => {
      // 清理事件
      $(".whois-modal-close").off("click");
    },
  });
}

/**
 * 绑定WHOIS模态窗口事件
 */
function bindWhoisModalEvents() {
  const $ = safe$();
  if (!$) return;

  // 关闭按钮事件
  $(".whois-modal-close").on("click", () => {
    ModalManager.hide("whois-modal");
  });

  // 点击遮罩层关闭
  $(".whois-modal-overlay").on("click", (e: any) => {
    if ($(e.target).hasClass("whois-modal-overlay")) {
      ModalManager.hide("whois-modal");
    }
  });

  // Tab切换事件
  $(".whois-tab-btn")
    .off("click")
    .on("click", function (this: HTMLElement, e: any) {
      e.preventDefault();
      const $this = $(this);
      const tabType = $this.data("tab");

      // 更新tab按钮状态
      $(".whois-tab-btn").removeClass("active");
      $this.addClass("active");

      // 先移除所有内容的active类和显示状态
      $(".whois-tab-content").removeClass("active").addClass("hidden");

      // 延迟显示新内容以实现平滑过渡
      setTimeout(() => {
        if (tabType === "optimized") {
          $("#whois-optimized-view").removeClass("hidden");
          setTimeout(() => $("#whois-optimized-view").addClass("active"), 10);
        } else if (tabType === "raw") {
          $("#whois-raw-view").removeClass("hidden");
          setTimeout(() => $("#whois-raw-view").addClass("active"), 10);
        }
      }, 50);
    });
}

/**
 * 查询WHOIS数据并重新渲染模态窗口
 * @param domain 域名
 */
async function queryWhoisData(domain: string) {
  const $ = safe$();
  if (!$) return;

  try {
    // 调用API查询WHOIS信息
    const response = await queryWhois(domain);
    if (response.status && response.data) {
      const data = response.data;
      // 处理状态样式类
      let statusClass = "bg-gray-100 text-gray-800";
      if (data.status) {
        if (data.status.includes("Transfer")) {
          statusClass = "bg-yellow-100 text-yellow-800";
        } else if (data.status.includes("Active")) {
          statusClass = "bg-green-100 text-green-800";
        }
      }

      // 处理邮箱数据
      const emails = Array.isArray(data.emails)
        ? data.emails.join(", ")
        : data.emails || "-";

      // 处理域名服务器数据
      const nameServers = Array.isArray(data.name_servers)
        ? data.name_servers
        : [];

      // 构建成功状态的模板数据
      const templateData = {
        domain,
        isLoading: false,
        hasError: false,
        errorMessage: "",
        hasData: true,
        domainName: data.domain_name || domain,
        status: data.status || "-",
        statusClass,
        registrar: data.registrar || "-",
        creationDate: data.creation_date || "-",
        expirationDate: data.expiration_date || "-",
        updatedDate: data.updated_date || "-",
        registrant: data.name || "-",
        registrarName: data.registrar || "-",
        emails,
        nameServers,
        rawData: data.rawData || "暂无原始数据",
      };

      // 重新渲染模态窗口内容
      const newContent = renderTemplate(TPL_WHOIS_MODAL, templateData);
      // console.log(newContent, $("#whois-modal .modal-body-content"));
      $("#whois-modal .modal-body-content").html(newContent);
      // 重新绑定事件
      bindWhoisModalEvents();
    } else {
      throw new Error("查询失败");
    }
  } catch (error: any) {
    console.error("WHOIS查询失败:", error);

    // 构建错误状态的模板数据
    const errorData = {
      domain,
      isLoading: false,
      hasError: true,
      errorMessage: error.message || "查询失败，请稍后重试",
      hasData: false,
      domainName: "",
      status: "",
      statusClass: "",
      registrar: "",
      creationDate: "",
      expirationDate: "",
      updatedDate: "",
      registrant: "",
      registrarName: "",
      emails: "",
      nameServers: [],
      rawData: "",
    };

    // 重新渲染模态窗口内容
    const newContent = renderTemplate(TPL_WHOIS_MODAL, errorData);
    $(".modal-content").html($(newContent).find(".modal-content").html());

    // 重新绑定事件
    bindWhoisModalEvents();
  }
}

// 订阅流（核心）：
// 1) 域名参数变化（param.*）→ 请求域名列表
// 2) 域名列表变化（list）→ 渲染域名列表 → 触发实名模板请求
// 3) 购物车变化（list/total）→ 渲染购物车
// 4) 实名模板变化（list）→ 渲染模板下拉
domainSubscribe((path: string, _value: any, s: DomainStore) => {
  console.log(path, _value);
  if (path.startsWith("param.")) {
    const { domain, p, rows, recommend_type } = s.param;
    const keyword = (domain || "").trim();
    if (keyword.length > 0) {
      // 复用首页的域名校验规则
      const hasChinese = /[\u4e00-\u9fa5]/.test(keyword);
      const hasInvalidChar = /[^a-zA-Z0-9\-.]/.test(keyword);
      const startsWithHyphen = /^-/.test(keyword);
      const stripped = keyword.replace(/\./g, "");
      const onlyHyphens = /^-+$/.test(stripped);

      if (hasChinese) {
        NotificationManager.show?.({
          type: "error",
          message: "不支持中文，请使用英文和数字",
        });
        return;
      }
      if (hasInvalidChar) {
        NotificationManager.show?.({
          type: "error",
          message: "仅支持字母、数字、连接符(-)和点(.)",
        });
        return;
      }
      if (startsWithHyphen) {
        NotificationManager.show?.({
          type: "error",
          message: "不能以连接符(-)开头",
        });
        return;
      }
      if (onlyHyphens) {
        NotificationManager.show?.({
          type: "error",
          message: "不能仅由连接符(-)组成",
        });
        return;
      }
      fetchDomainList({
        domain: keyword,
        p,
        rows,
        recommend_type,
      });
    } else {
      domainState.list = [];
    }
  }
  if (path === "list") {
    renderDomainList(s.list);
    // 完成域名列表后，渲染实名模板列表
    fetchRealNameList();
  }
  // 统一管理输入与清空按钮显隐
  if (path === "input") {
    const $ = safe$();
    const hasValue = (s.input || "").trim().length > 0;
    if ($) {
      if (hasValue) $("#clear-input-button").removeClass("hidden");
      else $("#clear-input-button").addClass("hidden");
      if ($("#domain-query-input").length) {
        $("#domain-query-input").val(s.input);
      }
      // 当输入框为空时显示空状态提示
      if (!hasValue) {
        $("#empty-state-container").removeClass("hidden");
      } else {
        $("#empty-state-container").addClass("hidden");
      }
    }
  }
});

// 订阅：购物车变化 -> 渲染
cartSubscribe((path: string, _value: any, s: CartStore) => {
  if (path === "list" || path === "originalTotal" || path === "payableTotal") {
    renderCart(s);
    // 同步更新搜索结果的"加入购物车"按钮选中/禁用状态
    if (Array.isArray(domainState.list) && domainState.list.length > 0) {
      renderDomainList(domainState.list);
    }
  }
});

// 订阅：实名模板变化 -> 渲染模板选择
realNameSubscribe((path: string, _value: any, s: RealNameStore) => {
  if (path === "list") {
    renderRealNameTemplates(s.list);
  }
});

// ----------------------------
// 初始化阶段：从 URL 读取参数并触发订阅
// WHY: 通过写入 store.param 统一触发查询与渲染，无需显式调用渲染函数
// ----------------------------
(async function init() {
  const search = (getUrlParam("search") || getUrlParam("domain") || "").trim();
  const p = Number(getUrlParam("p") || "1") || 1;
  const rows = Number(getUrlParam("rows") || "20") || 20;
  const recommendTypeVal = getUrlParam("recommend_type");
  const recommend_type =
    recommendTypeVal != null ? Number(recommendTypeVal) : -1;

  const $ = safe$();
  domainState.input = search;

  // 初始化清空按钮可见性和空状态容器
  if ($) {
    const hasValue = (domainState.input || "").trim().length > 0;
    if (hasValue) {
      $("#clear-input-button").removeClass("hidden");
      $("#empty-state-container").addClass("hidden");
    } else {
      $("#clear-input-button").addClass("hidden");
      $("#empty-state-container").removeClass("hidden");
    }
  }

  // 先设置非触发字段，再优先拉取购物车，最后设置 domain 触发查询与渲染
  domainState.param.p = p;
  domainState.param.rows = rows;
  domainState.param.recommend_type = recommend_type;
  await fetchCartList();
  domainState.param.domain = search;
})();

// ----------------------------
// 事件绑定
// ----------------------------
function bindEvents() {
  const $ = safe$();
  if (!$) return;

  // 移除旧的 hover 样式，启用点击展示
  $("#contact-service-popup-style").remove();
  bindContactServicePopupClick();

  // 初始化移动端底部购物车并绑定事件
  ensureMobileCartBar();
  $(document)
    .off("click", "#mobile-checkout-button")
    .on("click", "#mobile-checkout-button", async function () {
      const hasItems =
        Array.isArray(cartState.list) && cartState.list.length > 0;
      if (!hasItems) {
        NotificationManager.show?.({
          type: "warning",
          message: "购物车为空，请先添加域名",
        });
        return;
      }
      await showPaymentModal();
    });

  // 下拉展开/收起
  $(document)
    .off("click.mobileCart", "#mobile-cart-toggle")
    .on("click.mobileCart", "#mobile-cart-toggle", function (this: any) {
      const $toggle = $(this);
      if ($("#mobile-cart-bar").hasClass("empty")) return; // 空态不展开
      const expanded = $toggle.attr("aria-expanded") === "true";
      const $dropdown = $("#mobile-cart-dropdown");
      if (expanded) {
        $dropdown.removeClass("open").attr("aria-hidden", "true");
        $toggle.attr("aria-expanded", "false").removeClass("expanded");
      } else {
        $dropdown.addClass("open").attr("aria-hidden", "false");
        $toggle.attr("aria-expanded", "true").addClass("expanded");
      }
    });

  // 点击空白关闭
  $(document)
    .off("click.mobileCartOutside")
    .on("click.mobileCartOutside", function (e: any) {
      const target = $(e.target);
      if (
        !target.closest(
          "#mobile-cart-dropdown, #mobile-cart-toggle, #mobile-cart-bar"
        ).length &&
        $("#mobile-cart-dropdown").hasClass("open")
      ) {
        $("#mobile-cart-dropdown")
          .removeClass("open")
          .attr("aria-hidden", "true");
        $("#mobile-cart-toggle")
          .attr("aria-expanded", "false")
          .find("i")
          .removeClass("fa-caret-down")
          .addClass("fa-caret-up");
      }
    });

  // 屏幕尺寸变化时关闭下拉
  $(window)
    .off("resize.mobileCart")
    .on("resize.mobileCart", function () {
      if (window.innerWidth >= 740) {
        $("#mobile-cart-dropdown")
          .removeClass("open")
          .attr("aria-hidden", "true");
        $("#mobile-cart-toggle")
          .attr("aria-expanded", "false")
          .find("i")
          .removeClass("fa-caret-down")
          .addClass("fa-caret-up");
      }
    });

  // 移动端下拉：移除条目
  $(document)
    .off("click.mobileCart", ".mobile-cart-list .remove-from-cart")
    .on(
      "click.mobileCart",
      ".mobile-cart-list .remove-from-cart",
      async function (this: any) {
        const $btn = $(this);
        const index = Number($btn.data("index"));
        const item = (cartState.list || [])[index] as any;
        if (!item) return;
        try {
          $btn.prop("disabled", true);
          OverlayManager.showGlobal?.({ content: "移除中..." });
          await apiRemoveFromCart({ cart_id: Number(item.id) });
          await fetchCartList();
          NotificationManager.show?.({ type: "success", message: "已移除" });
        } catch (err) {
          console.error("移除失败", err);
          NotificationManager.show?.({
            type: "error",
            message: "移除失败，请重试",
          });
        } finally {
          $btn.prop("disabled", false);
          OverlayManager.hideGlobal?.();
        }
      }
    );

  // 移动端下拉：年限选择
  $(document).on(
    "click",
    ".mobile-cart-list .year-selector .select-display",
    function (this: any) {
      const $selector = $(this).closest(".year-selector");
      // 清理遗留菜单
      $("body .year-select-menu").remove();

      // 动态构建下拉菜单
      let $menu = $('<div class="select-menu year-select-menu"></div>');
      const options = [1, 2, 3, 5, 10];
      const html = options
        .map((y) => `<div class="select-option" data-value="${y}">${y}年</div>`)
        .join("");
      $menu.html(html);
      $("body").append($menu);
      // 先显示以获得正确尺寸，再定位；保持不可见避免闪烁
      $menu.css({ display: "block", visibility: "hidden" });

      const updatePosition = () => {
        const pos = calculateDropdownPosition($selector, $menu);
        $menu.css({
          position: "fixed",
          top: pos.top,
          left: pos.left + 80,
          maxHeight: pos.maxHeight,
          overflow: "auto",
          zIndex: 9998,
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: "6px",
          padding: "6px 0",
          minWidth: Math.max(80, $selector.outerWidth?.() || 80),
        });
      };
      updatePosition();
      $menu.css({ visibility: "visible" });

      const index = Number($selector.data("index"));
      const item = (cartState.list || [])[index] as any;
      const currentYears = Number(item?.years || $selector.data("value") || 1);
      $menu
        .find(`.select-option[data-value="${currentYears}"]`)
        .addClass("active bg-primary-10 text-primary");

      let ticking = false;
      const onWin = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          updatePosition();
          ticking = false;
        });
      };
      $(document).on("scroll.yearSelect resize.yearSelect", onWin);

      const onDoc = (e: any) => {
        if (!$(e.target).closest(".year-select-menu, .year-selector").length) {
          $(document).off("click", onDoc);
          $(document).off("scroll.yearSelect resize.yearSelect", onWin);
          $menu.remove();
        }
      };
      setTimeout(() => $(document).on("click", onDoc), 0);

      $menu
        .off("click", ".select-option")
        .on("click", ".select-option", async function (this: any) {
          const years = Number($(this).data("value"));
          const idx = Number($selector.data("index"));
          const it = (cartState.list || [])[idx] as any;
          if (!it) return;
          try {
            await apiUpdateCart({
              cart_id: Number(it.id),
              years,
              is_selected: Number(it.selected ?? 1),
            });
            await fetchCartList();
          } catch (err) {
            console.error("更新年限失败", err);
            NotificationManager.show?.({
              type: "error",
              message: "年限更新失败，请重试",
            });
          } finally {
            $(document).off("click", onDoc);
            $(window).off("scroll.yearSelect resize.yearSelect", onWin);
            $menu.remove();
          }
        });
    }
  );

  const triggerSearch = () => {
    const val = (domainState.input || "").trim();
    domainState.param.domain = val;
    domainState.param.p = 1;
    updateUrlParam("search", val || undefined);
    updateUrlParam("p", "1");
  };

  // 1) 输入框回车：重新搜索
  $("#domain-query-input").on("keydown", function (e: any) {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      triggerSearch();
    }
  });
  // 输入时切换清空按钮可见性
  $("#domain-query-input").on("input", function (this: HTMLElement) {
    domainState.input = String(($(this as any).val() as any) || "");
  });

  // 2) 清空输入按钮：清空当前域名信息
  $("#clear-input-button").on("click", function () {
    domainState.input = "";
    domainState.param.domain = "";
    updateUrlParam("search");
    $("#clear-input-button").addClass("hidden");
    $("#domain-query-input").trigger("focus");
  });

  // 3) 重新查询按钮：重新搜索（含底部按钮）
  $(".primary-action-button, #requery-bottom").on("click", function () {
    triggerSearch();
    try {
      const $ = safe$();
      if ($) {
        $("html, body").animate({ scrollTop: 0 }, 400);
        const $input = $("#domain-query-input");
        $input.addClass("input-highlight").trigger("focus");
        setTimeout(() => $input.removeClass("input-highlight"), 1500);
      }
    } catch {}
  });

  // 4) 筛选按钮：切换 recommend_type 并触发请求
  $(".filter-btn").on("click", function (this: any) {
    const $btn = $(this);
    $(".filter-btn").removeClass("active");
    $btn.addClass("active");
    const filter = String($btn.data("filter") || "all");
    let recommend = -1;
    switch (filter) {
      case "recommended":
        recommend = 1;
        break;
      case "popular":
        recommend = 2;
        break;
      case "discount":
        recommend = 3;
        break;
      case "cheap":
        recommend = 4;
        break;
      case "all":
      default:
        recommend = -1;
        break;
    }
    domainState.param.recommend_type = recommend;
    updateUrlParam(
      "recommend_type",
      recommend === -1 ? undefined : String(recommend)
    );
    // 不修改 domain，交由订阅在 param 变化时重新拉取
  });

  // 5) 加入购物车：事件代理
  $("#search-results").on("click", ".add-to-cart", async function (this: any) {
    const $btn = $(this);
    if ($btn.prop("disabled")) return;
    if (!window.isLoggedIn) {
      NotificationManager.show?.({
        type: "warning",
        message: "未登录,正在跳转至登录...",
      });
      setTimeout(() => {
        location.href = `/login.html?ReturnUrl=${location.href}`;
      }, 2000);
      return;
    }
    const fullDomain = String($btn.data("domain") || "");
    if (!fullDomain) return;

    // 从当前查询结果中查找后缀；若找不到则回退解析
    const item = (domainState.list || []).find(
      (it: any) => String((it as any).domain) === fullDomain
    ) as any;
    let suffix: string = (item && (item as any).suffix) || "";
    if (!suffix) {
      const parts = fullDomain.split(".");
      if (parts.length >= 2) suffix = parts.slice(1).join(".");
    }

    const normalizedSuffix = suffix || "";
    const domainName: string =
      normalizedSuffix && fullDomain.endsWith(normalizedSuffix)
        ? fullDomain
            .slice(0, fullDomain.length - normalizedSuffix.length)
            .replace(/\./g, "")
        : (fullDomain.split(".")[0] ?? "").replace(/\./g, "");

    try {
      // 点击动画（按钮 + 底部购物车轻微弹跳）
      $btn.addClass("btn-pulse");
      setTimeout(() => $btn.removeClass("btn-pulse"), 400);
      $("#mobile-cart-bar").addClass("bump");
      setTimeout(() => $("#mobile-cart-bar").removeClass("bump"), 400);

      $btn.prop("disabled", true);
      OverlayManager.showGlobal?.({
        content: "加入中...",
      });
      await apiAddToCart({ domain_name: domainName, suffix: normalizedSuffix });
      setTimeout(
        () =>
          NotificationManager.show?.({
            type: "success",
            message: "已加入购物车",
          }),
        1000
      );

      // 立即更新按钮文案与状态（无等待）
      $btn.prop("disabled", true);
      $btn.attr("title", "已加入购物车");
      const $span = $btn.find("span");
      if ($span && $span.length) $span.text("已加入购物车");
      await fetchCartList();
    } catch (err: any) {
      console.error("加入购物车失败", err);
      NotificationManager.show?.({
        type: "error",
        message: err?.message || "加入购物车失败，请重试",
      });
      $btn.prop("disabled", false);
    } finally {
      OverlayManager.hideGlobal();
    }
  });

  // 6) 查看更多域名：底部追加下一页
  $(document).on("click", "#show-more-button", async function (this: any) {
    const $btn = $(this);
    const keyword = (domainState.param?.domain || "").trim();
    if (!keyword) return;
    const nextPage = Math.max(1, Number(domainState.page || 1)) + 1;
    try {
      $btn.prop("disabled", true);
      OverlayManager.showView?.("#search-results", { content: "加载更多..." });
      const res = await domainQueryCheck({
        domain: keyword,
        p: nextPage,
        rows: domainState.param?.rows || 20,
        recommend_type: domainState.param?.recommend_type,
      });
      const data = (res.data as any) || {};
      const list: DomainItem[] = data?.data || [];
      const rows = Number(data?.row || domainState.param?.rows || 20);
      const hasMore = Array.isArray(list) && list.length >= rows;
      domainState.page = nextPage;
      domainState.hasMore = hasMore;
      appendDomainList(list);
    } catch (err) {
      console.error("加载更多失败", err);
      NotificationManager.show?.({
        type: "error",
        message: "加载更多失败，请重试",
      });
    } finally {
      OverlayManager.hideView?.("#search-results");
      $btn.prop("disabled", false);
    }
  });

  // 6) 价格提示：移入显示、移出隐藏
  $("#search-results")
    .on("mouseenter", ".price-tooltip-container", function (this: any) {
      const $tip = $(this).find(".price-tooltip");
      $tip.removeClass("opacity-0 invisible").addClass("opacity-100 visible");
    })
    .on("mouseleave", ".price-tooltip-container", function (this: any) {
      const $tip = $(this).find(".price-tooltip");
      $tip.addClass("opacity-0 invisible").removeClass("opacity-100 visible");
    });

  // 购物车相关事件代理
  const cartRoot = $("#filled-cart");

  // a) 从购物车移除
  cartRoot.on("click", ".remove-from-cart", async function (this: any) {
    const $btn = $(this);
    const index = Number($btn.data("index"));
    const item = (cartState.list || [])[index] as any;
    if (!item) return;
    try {
      $btn.prop("disabled", true);
      OverlayManager.showGlobal?.({ content: "移除中..." });
      await apiRemoveFromCart({ cart_id: Number(item.id) });
      await fetchCartList();
      NotificationManager.show?.({ type: "success", message: "已移除" });
    } catch (err) {
      console.error("移除失败", err);
      NotificationManager.show?.({
        type: "error",
        message: "移除失败，请重试",
      });
    } finally {
      $btn.prop("disabled", false);
      OverlayManager.hideGlobal?.();
    }
  });

  // b) 清空购物车
  $("#clear-cart-button").on("click", async function (this: any) {
    const $btn = $(this);
    try {
      $btn.prop("disabled", true);
      OverlayManager.showGlobal?.({ content: "清空中..." });
      await apiClearCart({} as any);
      await fetchCartList();
      NotificationManager.show?.({ type: "success", message: "购物车已清空" });
    } catch (err) {
      console.error("清空购物车失败", err);
      NotificationManager.show?.({
        type: "error",
        message: "清空失败，请重试",
      });
    } finally {
      $btn.prop("disabled", false);
      OverlayManager.hideGlobal?.();
    }
  });

  // c) 年限下拉（自定义选择器）展开与选择
  cartRoot.on("click", ".year-selector .select-display", function (this: any) {
    const $selector = $(this).closest(".year-selector");
    // 移除之前遗留的菜单，避免重复创建与内存泄漏
    $("body .year-select-menu").remove();

    // 动态构建下拉菜单
    let $menu = $('<div class="select-menu year-select-menu"></div>');
    const options = [1, 2, 3, 5, 10];
    const html = options
      .map((y) => `<div class="select-option" data-value="${y}">${y}年</div>`)
      .join("");
    $menu.html(html);
    $("body").append($menu);

    // 计算并设置位置（使用 fixed，减少滚动错位）
    const updatePosition = () => {
      const pos = calculateDropdownPosition($selector, $menu);
      $menu.css({
        position: "fixed",
        top: pos.top,
        left: pos.left,
        maxHeight: pos.maxHeight,
        overflow: "auto",
        zIndex: 9999,
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: "6px",
        padding: "6px 0",
        minWidth: Math.max(80, $selector.outerWidth?.() || 80),
      });
    };
    updatePosition();
    $menu.show();

    // 高亮当前选中年限
    const index = Number($selector.data("index"));
    const item = (cartState.list || [])[index] as any;
    const currentYears = Number(item?.years || $selector.data("value") || 1);
    $menu
      .find(`.select-option[data-value="${currentYears}"]`)
      .addClass("active bg-primary-10 text-primary");

    // 窗口滚动/缩放时，使用 rAF 节流保持定位同步
    let ticking = false;
    const onWin = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updatePosition();
        ticking = false;
      });
    };
    $(document).on("scroll.yearSelect resize.yearSelect", onWin);

    // 点击空白关闭并清理
    const onDoc = (e: any) => {
      if (!$(e.target).closest(".year-select-menu, .year-selector").length) {
        $(document).off("click", onDoc);
        $(document).off("scroll.yearSelect resize.yearSelect", onWin);
        $menu.remove();
      }
    };
    setTimeout(() => $(document).on("click", onDoc), 0);

    // 选项点击
    $menu
      .off("click", ".select-option")
      .on("click", ".select-option", async function (this: any) {
        const years = Number($(this).data("value"));
        const idx = Number($selector.data("index"));
        const it = (cartState.list || [])[idx] as any;
        if (!it) return;
        try {
          await apiUpdateCart({
            cart_id: Number(it.id),
            years,
            is_selected: Number(it.selected ?? 1),
          });
          await fetchCartList();
        } catch (err) {
          console.error("更新年限失败", err);
          NotificationManager.show?.({
            type: "error",
            message: "年限更新失败，请重试",
          });
        } finally {
          $(document).off("click", onDoc);
          $(window).off("scroll.yearSelect resize.yearSelect", onWin);
          $menu.remove();
        }
      });
  });

  // d) 立即购买 -> 打开购物车结算弹窗
  $("#checkout-button").on("click", async function () {
    const hasItems = Array.isArray(cartState.list) && cartState.list.length > 0;
    // if (!window.isLoggedIn) {
    //   NotificationManager.show?.({
    //     type: "warning",
    //     message: "当前未登录宝塔账号，正在跳转登录页",
    //     zIndex: 9999,
    //   });
    //   setTimeout(() => {
    //     window.location.href =
    //       "https://www.bt.cn/login.html?ReturnUrl=" + window.location.href;
    //   }, 1500);
    //   return;
    // }
    if (!hasItems) {
      NotificationManager.show?.({
        type: "warning",
        message: "购物车为空，请先添加域名",
      });
      return;
    }
    await showPaymentModal();
  });
  $(document).on("mouseenter", ".price-trigger", function (this: any) {
    const $wrap = $(this).closest(".flex.items-center.justify-end");
    const $tip = $wrap.find(".price-tooltip");
    $tip
      .removeClass("invisible opacity-0 translate-y-1")
      .addClass("opacity-100 translate-y-0");
  });

  $(document).on("mouseleave", ".price-trigger", function (this: any) {
    const $wrap = $(this).closest(".flex.items-center.justify-end");
    const $tip = $wrap.find(".price-tooltip");
    $tip.addClass("opacity-0 translate-y-1").removeClass("opacity-100");
    setTimeout(() => {
      $tip.addClass("invisible");
    }, 200);
  });

  // 刷新实名模板列表按钮
  $(document)
    .off("click", "#refresh-real-name-templates")
    .on("click", "#refresh-real-name-templates", async function (this: any) {
      const $btn = $(this);
      const $svg = $btn.find("svg");

      // 添加旋转动画
      $svg.addClass("animate-spin");
      $btn.prop("disabled", true);

      try {
        // 重新获取实名模板列表
        await fetchRealNameList();

        NotificationManager.show?.({
          type: "success",
          message: "实名模板列表已刷新",
        });
      } catch (err) {
        console.error("刷新实名模板列表失败", err);
        NotificationManager.show?.({
          type: "error",
          message: "刷新失败，请重试",
        });
      } finally {
        // 移除旋转动画
        $svg.removeClass("animate-spin");
        $btn.prop("disabled", false);
      }
    });

  // WHOIS查询按钮点击事件
  $(document)
    .off("click", ".whois-query-btn")
    .on("click", ".whois-query-btn", async function (this: any) {
      const $btn = $(this);
      const domain = $btn.data("domain");

      if (!domain) {
        console.error("未找到域名信息");
        return;
      }

      // 显示WHOIS模态窗口
      await showWhoisModal(domain);
    });
}

bindEvents();

// ----------------------------
// 移动端底部购物车（辅助函数）
// ----------------------------
function ensureMobileCartBar() {
  const $ = safe$();
  if (!$) return;
  if ($("#mobile-cart-bar").length) return;
  const html = `
  <div id="mobile-cart-bar" class="mobile-cart-bar bg-gray-50">
    <div class="mobile-cart-left">
      <div class="mobile-cart-summary">
        <span class="mobile-cart-total-label">应付金额:</span>
        <span id="mobile-cart-payable" class="mobile-cart-total-value">¥0</span>
        <span id="mobile-cart-count" class="mobile-cart-count">域名：0</span>
        <button id="mobile-cart-toggle" class="mobile-cart-toggle" aria-expanded="false" title="展开购物车">
          <i class="fa fa-caret-down text-gray-400 ml-1 hover:text-primary transition-colors"></i>
        </button>
      </div>
      <div class="mobile-cart-discount">总价：<span id="mobile-cart-original">¥0</span>，减去优惠: <span id="mobile-cart-discount">¥0</span></div>
    </div>
    <div class="mobile-cart-empty" id="mobile-cart-empty" style="display:none;">购物车还是空的，从上方选择域名加入购物车</div>
    <button id="mobile-checkout-button" class="mobile-cart-submit">立即购买</button>
  </div>
  <div id="mobile-cart-dropdown" class="mobile-cart-dropdown" aria-hidden="true">
    <div class="mobile-cart-list" id="mobile-cart-list"></div>
  </div>`;
  $("body").append(html);
}

// 渲染移动端购物车列表
function renderMobileCartList(cart: CartStore) {
  const $ = safe$();
  if (!$) return;
  const items = (cart.list || []) as any[];
  const rows = items.map((item: any, index: number) => {
    const years = Number(item.years || 1);
    const unit = Number(
      item.total_price ?? item.price ?? item.domain_service_price ?? 0
    );
    const domain = String(item.full_domain || item.domain_name || "");
    return `
      <div class="mobile-cart-item">
        <div class="mobile-cart-item-main">
          <div class="mobile-cart-domain" title="${domain}">${domain}</div>
          <div class="mobile-cart-actions">
            <div class="custom-select year-selector" data-index="${index}" data-value="${years}" style="width: 84px; display:inline-block;">
              <div class="select-display h-[28px] leading-[28px]">
                <span class="select-text">${years}年</span>
                <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 12px; height: 12px;"><polyline points="6,9 12,15 18,9"></polyline></svg>
              </div>
            </div>
            <div class="mobile-cart-price">${formatPrice(unit)}</div>
            <button class="remove-from-cart mobile-remove" data-index="${index}" title="移除"><i class="fa fa-trash-o"></i></button>
          </div>
        </div>
      </div>`;
  });
  $("#mobile-cart-list").html(rows.join(""));
}

// 更新移动端购物车底部栏
function updateMobileCartBar(cart: CartStore) {
  const $ = safe$();
  if (!$) return;
  ensureMobileCartBar();
  const items = (cart.list || []) as any[];
  const count = items.length;
  const original = Number((cart as any).originalTotal ?? 0);
  const payable = Number((cart as any).payableTotal ?? 0);
  const discount = Math.max(0, original - payable);
  $("#mobile-cart-count").text(`域名：${count}`);
  $("#mobile-cart-payable").text(formatPrice(payable));
  $("#mobile-cart-original").text(formatPrice(original));
  $("#mobile-cart-discount").text(`¥${discount.toFixed(2)}`);
  renderMobileCartList(cart);
  const $bar = $("#mobile-cart-bar");
  const $dropdown = $("#mobile-cart-dropdown");
  const $empty = $("#mobile-cart-empty");
  // 始终显示底部条
  $bar.addClass("visible");
  if (count > 0) {
    $bar.removeClass("empty");
    $empty.hide();
    $(
      ".mobile-cart-summary, .mobile-cart-discount, #mobile-cart-toggle, #mobile-checkout-button"
    ).show();
  } else {
    // 空态：展示提示，仅显示底部条
    $bar.addClass("empty");
    $empty.show();
    $(
      ".mobile-cart-summary, .mobile-cart-discount, #mobile-cart-toggle, #mobile-checkout-button"
    ).hide();
    // 关闭下拉
    $dropdown.removeClass("open").attr("aria-hidden", "true");
    $("#mobile-cart-toggle")
      .attr("aria-expanded", "false")
      .removeClass("expanded");
  }
}
