/**
 * 模板数据映射（基于 domain-registration.html 中的所有 `<script type="text/template">`）
 *
 * 目的：
 * - 提供模板 ID 到其上下文数据类型的强类型关联
 * - 通过模块增强为 `renderTemplate`/`renderTemplateList` 提供类型提示与校验
 */

// 单项结构声明
export interface OrderSuccessDomainItem {
  domain: string
  years: number | string
  templateName: string
  formattedPrice: string
}

export interface ConfirmDeleteItem {
  domain: string
  years: number | string
  formattedPrice: string
}

interface SearchResultItem {
  domain: string
  isLast: boolean
  isRegistered: boolean
  statusText: string
  hasRecommended?: boolean
  hasPopular: boolean
  hasDiscount: boolean
  whoisUrl: string
  // 价格
  price: number
  originalPrice: number
  formattedPrice: string
  formattedOriginalPrice: string
  hasOriginalPrice: boolean
  // 多年价格展示
  price3Years: string
  price5Years: string
  price10Years: string
  renewPrice3Years: string
  renewPrice5Years: string
  renewPrice10Years: string
  // 购物车状态
  isInCart: boolean
  // 角标
  discountPercent?: number | string
}

/**
 * 所有模板 ID 与其数据结构的映射
 */
export interface TemplateDataMap {
  // 空状态
  'empty-state-template': {
    icon: string
    text: string
    hint?: string
  }

  // 搜索结果项（域名）
  'search-result-item-template': {
    list: SearchResultItem[]
  }

  // 查看更多按钮
  'view-more-button-template': Record<string, never>

  // 购物车项目
  'cart-item-template': {
    index: number
    domain: string
    years: number | string
    formattedOriginalPrice: string
    formattedPrice: string
  }

  // 实名模板选项（通用）
  'template-option-template': {
    id: string | number
    name: string
    desc?: string
    formattedPrice?: string
  }

  // 模态框容器与内容
  'modal-container-template': {
    id: string
    className?: string
    zIndex?: number | string
  }
  'modal-content-template': {
    title?: string
    closable?: boolean
    content: string
    hasButtons?: boolean
    buttonsHtml?: string
    sizeClass?: string
  }
  'modal-button-template': {
    id?: string
    typeClass?: string
    className?: string
    text: string
    onClick?: string
  }

  // 通知
  'notification-container-template': {
    id: string
    positionClass?: string
    zIndex?: number | string
  }
  'notification-content-template': {
    bgClass?: string
    textClass?: string
    iconClass?: string
    iconColor?: string
    title?: string
    message: string
    closable?: boolean
  }

  // 购买弹窗 - 模板选择与价格/提示
  'buy-modal-template-selector-template': {
    selectedTemplateName: string
  }
  'buy-modal-price-info-template': {
    formattedOriginalPrice: string
    hasDiscount?: boolean
    formattedDiscount?: string
    formattedPrice: string
  }
  'buy-modal-warning-template': Record<string, never>
  'buy-modal-content-template': {
    domain: string
    templateSelectorHtml: string
    priceInfoHtml: string
    warningHtml: string
  }

  // 支付弹窗 - 购物车项与列表
  'payment-cart-item-template': {
    index: number
    selected?: boolean
    domain: string
    years: number | string
    formattedTotalPrice: string
    formattedUnitPrice: string
  }
  'payment-modal-cart-items-template': {
    totalItems: number
    cartItemsHtml: string
  }
  'payment-modal-warning-template': Record<string, never>

  // 支付方式选择
  'payment-method-selector-template': {
    isWechatSelected?: boolean
    isAlipaySelected?: boolean
    isBalanceSelected?: boolean
    accountBalance?: string | number
    insufficientBalance?: boolean
  }

  // 支付弹窗底部汇总与模板选择
  'payment-modal-payment-section-template': {
    selectedTemplateId?: string | number
    selectedTemplateName: string
    formattedOriginalTotal: string
    formattedDiscount?: string
    formattedPayableTotal: string
  }

  // 支付弹窗整体内容
  'payment-modal-content-template': {
    warningHtml: string
    cartItemsHtml: string
    paymentSectionHtml: string
  }

  // 支付界面（独立页）
  'payment-interface-template': {
    orderItemsHtml: string
    formattedOriginalTotal: string
    hasDiscount?: boolean
    formattedDiscount?: string
    formattedPayableTotal: string
    isWechatSelected?: boolean
    isAlipaySelected?: boolean
    isBalanceSelected?: boolean
    insufficientBalance?: boolean
  }

  // 订单项目（支付界面左侧）
  'order-item-template': {
    domain: string
    years: number | string
    templateName: string
    formattedTotalPrice: string
  }

  // 订单成功页
  'order-success-template': {
    orderNumber: string
    domains: OrderSuccessDomainItem[]
    formattedOriginalTotal: string
    hasDiscount?: boolean
    formattedDiscount?: string
    formattedPayableTotal: string
    paymentMethod: string
    paymentTime: string
    transactionId: string
  }

  // 实名模板下拉选项
  'template-select-option-template': {
    id: string | number
    name: string
    desc?: string
    selected?: boolean
  }

  // 确认删除弹窗
  'confirm-delete-modal-template': {
    itemCount: number
    items: ConfirmDeleteItem[]
  }

  // 域名注册协议模态窗口
  'domain-agreement-modal-template': Record<string, never>

  // WHOIS查询模态窗口
  'whois-modal-template': {
    domain: string
    isLoading?: boolean
    hasError?: boolean
    errorMessage?: string
    hasData?: boolean
    domainName?: string
    status?: string
    statusClass?: string
    registrar?: string
    creationDate?: string
    expirationDate?: string
    updatedDate?: string
    registrant?: string
    registrarName?: string
    emails?: string
    nameServers?: string[]
    rawData?: string
  }
}

// ---------------- 模块增强：为 @utils 提供模板 ID 智能提示与数据类型校验 ----------------
import type { RenderTemplateInstance } from '@utils'

declare module '@utils' {
  /** 根据模板 ID 精确定义 renderTemplate 的数据类型 */
  // 非响应式
  export function renderTemplate<K extends keyof TemplateDataMap>(templateId: K, data: TemplateDataMap[K]): string

  // 响应式
  export function renderTemplate<K extends keyof TemplateDataMap, T extends TemplateDataMap[K]>(
    templateId: K,
    data: T,
    options: { reactive: true }
  ): RenderTemplateInstance<T>

  /** 模板列表渲染 */
  export function renderTemplateList<K extends keyof TemplateDataMap>(
    templateId: K,
    dataArray: Array<TemplateDataMap[K]>
  ): string
}
