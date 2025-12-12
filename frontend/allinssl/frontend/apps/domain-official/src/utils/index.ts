/**
 * @module @utils
 * 新的聚合入口，统一导出 `core` 与 `ui` 两类通用工具，降低导入复杂度。
 *
 * - 核心方法（Core）：数据获取、模版渲染、防抖、价格格式化、URL 参数处理、存储与轻量状态等
 * - UI 管理（UI）：模态框、通知、下拉与遮罩层的展示/管理器
 *
 * 导入方式：
 * ```ts
 * import { calculateDropdownPosition, ModalManager } from '@utils'
 * // 或
 * import Utils from '@utils'
 * ```
 */
export * from './core'
export * from './ui'
export * from './date'
export * from './type'

import {
  getDeepValue,
  calculateDropdownPosition,
  renderTemplate,
  renderTemplateList,
  debounce,
  formatPrice,
  getUrlParam,
  updateUrlParam,
  storage,
  createState,
  createStore,
} from './core'
import * as DateUtils from './date'
import * as TypeUtils from './type'

import { ModalManager, NotificationManager, DropdownManager, OverlayManager } from './ui'

export {
  getDeepValue,
  calculateDropdownPosition,
  renderTemplate,
  renderTemplateList,
  debounce,
  formatPrice,
  getUrlParam,
  updateUrlParam,
  storage,
  createState,
  createStore,
  ModalManager,
  NotificationManager,
  DropdownManager,
  OverlayManager,
  DateUtils,
  TypeUtils,
}

export const Utils = {
  calculateDropdownPosition,
  renderTemplate,
  renderTemplateList,
  debounce,
  formatPrice,
  getUrlParam,
  updateUrlParam,
  storage,
  createState,
  createStore,
  DateUtils,
  TypeUtils,
}

export default Utils
