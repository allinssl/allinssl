/**
 * 隐私保护弹窗相关类型定义
 */

import type { DomainItem } from '@/types/domain'

/**
 * 隐私保护弹窗组件属性
 */
export interface PrivacyProtectionModalProps {
  /** 域名信息 */
  domain: DomainItem
  /** 刷新回调函数 */
  refresh: () => void
}

/**
 * 隐私保护表单数据
 */
export interface PrivacyProtectionFormData {
  /** 域名 */
  domain: string
  /** 保护时长（年） */
  protectionTime: number
  /** 联系邮箱 */
  contactEmail: string
  /** 保护价格 */
  price: number
  /** 支付方式 */
  paymentMethod: 'wechat' | 'alipay' | 'balance'
}

/**
 * 隐私保护步骤类型
 */
export type PrivacyProtectionStep = 1 | 2

/**
 * 支付方式选项
 */
export interface PaymentMethodOption {
  label: string
  value: 'wechat' | 'alipay' | 'balance'
  description?: string
}

/**
 * 保护时长选项
 */
export interface ProtectionTimeOption {
  label: string
  value: number
} 