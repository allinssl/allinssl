/**
 * UI 管理工具集合
 *
 * 提供 Dropdown / Modal / Overlay / Notification 等界面元素的展示与生命周期管理，
 * 封装创建、定位、过渡动画、事件绑定与批量隐藏等常见逻辑。
 *
 * 依赖：`window.$`（jQuery 兼容接口）与模版渲染工具。
 */
import type {
  DropdownShowConfig,
  ModalConfig,
  NotificationConfig,
  OverlayOptions,
  SpinnerType,
  DropdownOptionStruct,
} from '../types/utils'
import { calculateDropdownPosition } from './core'
import { renderTemplate } from './core'

// ---------------- 全局层级管理（ZIndexManager） ----------------
/**
 * 全局层级管理器
 *
 * - 通过递增 `z-index` 管理多类浮层叠放关系
 * - `acquire(key)` 获取新层级，`release(key)` 释放
 */
class ZIndexManagerClass {
  private base = 50
  private step = 10
  private stack: Array<{ key: string; z: number }> = []

  /** 设置基础层级 */
  setBase(base: number) {
    this.base = base
  }
  /** 设置层级步进 */
  setStep(step: number) {
    this.step = step
  }
  /**
   * 申请一个 z-index
   * @param key 实例标识（如 dropdown-1）
   * @returns 新的 z-index
   */
  acquire(key: string): number {
    const last = this.stack.length ? this.stack[this.stack.length - 1] : undefined
    const top = last ? last.z : this.base
    const next = top + this.step
    this.stack.push({ key, z: next })
    return next
  }
  /** 释放某个实例对应的 z-index */
  release(key: string) {
    this.stack = this.stack.filter(i => i.key !== key)
  }
  /** 查看当前栈顶层级 */
  peek(): number {
    const last = this.stack.length ? this.stack[this.stack.length - 1] : undefined
    return last ? last.z : this.base
  }
  /** 清空层级栈 */
  reset() {
    this.stack = []
  }
}

export const ZIndexManager = new ZIndexManagerClass()

// ---------------- Dropdown（Class） ----------------
type ActiveDropdown = { $element: any; $trigger: any; config: DropdownShowConfig }

/**
 * 下拉菜单管理器
 * - show/hide/hideAll/updateContent/getActiveDropdowns
 */
class DropdownManagerClass {
  private activeDropdowns: Map<string, ActiveDropdown> = new Map()
  private dropdownIdCounter = 0

  private createDropdownContainer(config: {
    id: string
    className?: string
    zIndex?: number
    position?: 'fixed' | 'absolute'
    appendTo?: any
  }) {
    const { id, className = '', zIndex = ZIndexManager.acquire(id), position = 'fixed', appendTo } = config
    const $dropdown = (window as any).$(
      `<div id="${id}" class="dropdown-container ${className}" style="position: ${position}; z-index: ${zIndex}; display: none; opacity: 0; transition: opacity 120ms ease-out;"></div>`
    )
    const $mount = appendTo ? appendTo : (window as any).$('body')
    $mount.append($dropdown)
    return $dropdown
  }

  private getScrollContainer(element: HTMLElement | null): HTMLElement | null {
    if (!element) return null
    let node: HTMLElement | null = element.parentElement
    while (node && node !== document.body && node !== document.documentElement) {
      const style = window.getComputedStyle(node)
      const overflowY = style.overflowY
      const isScrollable = /auto|scroll|overlay/.test(overflowY)
      if (isScrollable && node.scrollHeight > node.clientHeight) {
        // 确保定位上下文
        if (style.position === 'static') node.style.position = 'relative'
        return node
      }
      node = node.parentElement
    }
    return null
  }

  private positionDropdown($dropdown: any, $trigger: any) {
    const position = calculateDropdownPosition($trigger, $dropdown)
    $dropdown.css({
      top: position.top,
      left: position.left,
      minWidth: $trigger.outerWidth?.(),
      maxHeight: position.maxHeight,
    })
  }

  /**
   * 显示下拉菜单
   * @returns dropdownId
   */
  show(config: DropdownShowConfig): string {
    const { trigger, content, className = '', zIndex = 1000, onSelect, data = {} } = config
    const dropdownId = config.id || `dropdown-${++this.dropdownIdCounter}`

    this.hideAll()
    if (this.activeDropdowns.has(dropdownId)) this.hide(dropdownId)

    const $trigger = (window as any).$(trigger)
    const scrollContainer = this.getScrollContainer(($trigger[0] as HTMLElement) || null)
    const useAbsolute = !!scrollContainer
    const $dropdown = this.createDropdownContainer({
      id: dropdownId,
      className,
      zIndex,
      position: useAbsolute ? 'absolute' : 'fixed',
      appendTo: useAbsolute ? (window as any).$(scrollContainer) : undefined,
    })

    // 动态渲染：若传入 options，则优先根据 options 渲染内容
    let finalContent = content || ''
    if (Array.isArray((config as any).options) && (config as any).options.length > 0) {
      const { options = [], optionMap, optionRender } = config as any
      const valueKey = optionMap?.value ?? 'value'
      const labelKey = optionMap?.label ?? optionMap?.text ?? 'label'
      const disabledKey = optionMap?.disabled ?? 'disabled'
      const classKey = optionMap?.className ?? 'className'

      const normalize = (item: any): DropdownOptionStruct => {
        if (typeof item === 'string' || typeof item === 'number') {
          return { value: item, label: String(item) }
        }
        const value = item?.[valueKey]
        const label = item?.[labelKey] ?? item?.text ?? item?.label ?? ''
        const disabled = !!item?.[disabledKey]
        const className = item?.[classKey]
        return { value, label, disabled, className, ...item }
      }

      const htmlList = (options as any[]).map((raw, idx) => {
        const n = normalize(raw)
        if (typeof optionRender === 'function') {
          return optionRender(n, raw, idx)
        }
        const disabledAttr = n.disabled ? ' data-disabled="true" aria-disabled="true"' : ''
        const classAttr = `dropdown-option ${n.className ? n.className : ''}`.trim()
        return `<div class="${classAttr}" data-value="${n.value}"${disabledAttr}>${n.label}</div>`
      })
      finalContent = htmlList.join('')
    }

    $dropdown.html(finalContent)
    $dropdown.css('display', 'block')

    this.positionDropdown($dropdown, $trigger)

    requestAnimationFrame(() => {
      $dropdown.css('opacity', 1)
    })

    $dropdown.on('click', '.dropdown-option', function (this: any, e: any) {
      e.stopPropagation()
      const $self = (window as any).$(this)
      if ($self.data('disabled') || $self.attr('aria-disabled') === 'true') return
      const value = $self.data('value')
      const text = $self.text()
      if (typeof onSelect === 'function') onSelect(value, text, data as any)
      DropdownManager.hide(dropdownId)
    })

    this.activeDropdowns.set(dropdownId, {
      $element: $dropdown,
      $trigger: (window as any).$(trigger),
      config,
    })
    ;(window as any).$(document).on(`click.dropdown.${dropdownId}`, (e: any) => {
      const $triggerElement = (window as any).$(trigger)
      if (
        !(window as any).$(e.target).closest(`#${dropdownId}`).length &&
        !$triggerElement.is(e.target) &&
        !$triggerElement.has(e.target).length
      ) {
        this.hide(dropdownId)
      }
    })

    return dropdownId
  }

  /** 隐藏指定下拉菜单 */
  hide(dropdownId: string) {
    const dropdown = this.activeDropdowns.get(dropdownId)
    if (!dropdown) return
    const { $element } = dropdown
    $element.css('opacity', 0)
    $element.one('transitionend webkitTransitionEnd oTransitionEnd', function () {
      $element.remove()
    })
    setTimeout(() => {
      if (this.activeDropdowns.has(dropdownId)) $element.remove()
    }, 150)
    this.activeDropdowns.delete(dropdownId)
    ;(window as any).$(document).off(`click.dropdown.${dropdownId}`)
    ZIndexManager.release(dropdownId)
  }

  /** 隐藏所有下拉菜单 */
  hideAll() {
    this.activeDropdowns.forEach((_dropdown, dropdownId) => this.hide(dropdownId))
  }

  /** 更新下拉内容并重新定位 */
  updateContent(dropdownId: string, content: string) {
    const dropdown = this.activeDropdowns.get(dropdownId)
    if (!dropdown) return
    const { $element, $trigger } = dropdown
    $element.html(content)
    this.positionDropdown($element, $trigger)
  }

  /** 获取当前活跃的下拉菜单 id 列表 */
  getActiveDropdowns(): string[] {
    return Array.from(this.activeDropdowns.keys())
  }
}

/**
 * DropdownManager
 *
 * - show(config): 显示下拉菜单并返回唯一 `dropdownId`
 * - hide(id): 隐藏指定下拉菜单
 * - hideAll(): 隐藏当前所有下拉菜单
 * - updateContent(id, html): 更新内容并重新定位
 * - getActiveDropdowns(): 获取当前活跃的下拉菜单 id 列表
 */
export const DropdownManager = new DropdownManagerClass()

// ---------------- Modal（Class） ----------------
type ActiveModal = { $element: any; config: ModalConfig }

/**
 * 模态框管理器
 * - show/hide/hideAll/getActiveModals
 */
class ModalManagerClass {
  private activeModals: Map<string, ActiveModal> = new Map()
  private modalIdCounter = 0

  private createModalContainer(config: { id: string; className?: string; zIndex?: number }) {
    const { id, className = '', zIndex = ZIndexManager.acquire(id) } = config
    const modalHtml = renderTemplate('modal-container-template', { id, className, zIndex })
    const $modal = (window as any).$(modalHtml)
    ;(window as any).$('body').append($modal)
    return $modal
  }

  private createModalContent(config: ModalConfig) {
    const { title = '', content = '', buttons = [], size = 'md', closable = true } = config
    const sizeClasses: Record<string, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '4xl': 'max-w-4xl',
    }
    const typeClasses: Record<string, string> = {
      primary: 'bg-primary hover:bg-primary-90 text-white font-bold',
      secondary: 'border border-gray-200 hover:bg-light text-secondary font-medium',
      danger: 'bg-red-500 hover:bg-red-600 text-white font-bold',
      default: 'border border-gray-200 hover:bg-light text-secondary font-medium',
    }
    const buttonsHtml = (buttons || [])
      .map(btn => {
        const { text, type = 'default', className = '', onClick = '', id = '' } = btn
        return renderTemplate('modal-button-template', { id, typeClass: typeClasses[type], className, onClick, text })
      })
      .join('')

    return renderTemplate('modal-content-template', {
      sizeClass: sizeClasses[size || 'md'],
      title,
      closable,
      content,
      hasButtons: (buttons || []).length > 0,
      buttonsHtml,
    })
  }

  /**
   * 显示模态框
   * @returns modalId
   */
  show(config: ModalConfig): string {
    const modalId = config.id || `modal-${++this.modalIdCounter}`
    if (this.activeModals.has(modalId)) this.hide(modalId)

    const $modal = this.createModalContainer({
      id: modalId,
      className: config.className || '',
      zIndex: config.zIndex || 50,
    })
    const contentHtml = this.createModalContent(config)
    $modal.html(contentHtml)

    $modal.on('click', '.modal-close', () => this.hide(modalId))
    $modal.on('click', (e: any) => {
      if (e.target === $modal[0] && config.maskClose) this.hide(modalId)
    })

    this.activeModals.set(modalId, { $element: $modal, config })

    $modal.removeClass('hidden').addClass('flex')
    requestAnimationFrame(() => {
      $modal.find('.modal-content').removeClass('scale-95 opacity-0').addClass('scale-100 opacity-100')
    })

    if (typeof config.onShow === 'function') config.onShow(modalId)
    return modalId
  }

  /** 隐藏指定模态框 */
  hide(modalId: string) {
    const modal = this.activeModals.get(modalId)
    if (!modal) return
    const { $element, config } = modal
    const $modalContent = $element.find('.modal-content')

    $modalContent
      .one('transitionend webkitTransitionEnd oTransitionEnd', () => {
        $element.remove()
        this.activeModals.delete(modalId)
        ZIndexManager.release(modalId)
        if (typeof config.onHide === 'function') config.onHide(modalId)
      })
      .removeClass('scale-100 opacity-100')
      .addClass('scale-95 opacity-0')

    setTimeout(() => {
      if (this.activeModals.has(modalId)) {
        $element.remove()
        this.activeModals.delete(modalId)
        ZIndexManager.release(modalId)
        if (typeof config.onHide === 'function') config.onHide(modalId)
      }
    }, 300)
  }

  /** 隐藏所有模态框 */
  hideAll() {
    this.activeModals.forEach((_modal, modalId) => this.hide(modalId))
  }

  /** 获取当前活跃的模态框 id 列表 */
  getActiveModals(): string[] {
    return Array.from(this.activeModals.keys())
  }
}

/**
 * ModalManager
 *
 * - show(config): 显示模态框并返回唯一 `modalId`
 * - hide(id): 隐藏指定模态框
 * - hideAll(): 隐藏当前所有模态框
 * - getActiveModals(): 获取当前活跃的模态框 id 列表
 */
export const ModalManager = new ModalManagerClass()

/**
 * 遮罩层管理器
 * - 支持全局与视图级遮罩，含加载动画与文案更新
 */
class OverlayManagerClass {
  private globalOverlay: { el: any; id: string } | null = null
  private viewOverlays: Map<string, { overlay: any; originalPosition: string; id: string }> = new Map()
  private overlayCounter = 0

  private getSpinnerHTML(type: SpinnerType): string {
    switch (type) {
      case 'dots':
        return `<div class="spinner-dots" style="display: flex; gap: 4px;"><div class="dot" style="width: 8px; height: 8px; border-radius: 50%; background-color: currentColor; animation: dotPulse 1.4s infinite ease-in-out both;"></div><div class="dot" style="width: 8px; height: 8px; border-radius: 50%; background-color: currentColor; animation: dotPulse 1.4s infinite ease-in-out both; animation-delay: -0.16s;"></div><div class="dot" style="width: 8px; height: 8px; border-radius: 50%; background-color: currentColor; animation: dotPulse 1.4s infinite ease-in-out both; animation-delay: -0.32s;"></div></div>`
      case 'pulse':
        return `<div class="spinner-pulse" style="width: 40px; height: 40px; border-radius: 50%; background-color: currentColor; animation: pulse 1.5s infinite ease-in-out;"></div>`
      default:
        return `<div class="spinner-default" style="width: 40px; height: 40px; border: 4px solid rgba(255, 255, 255, 0.3); border-top: 4px solid currentColor; border-radius: 50%; animation: spin 1s linear infinite;"></div>`
    }
  }

  private injectStyles() {
    if ((window as any).$('#overlay-styles').length === 0) {
      ;(window as any).$('head').append(
        `<style id="overlay-styles">
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes dotPulse { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
@keyframes pulse { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
.transition-overlay { user-select: none; pointer-events: auto; }
.transition-overlay.fade-in { opacity: 1 !important; }
body.overlay-lock-scroll { overflow: hidden !important; }
</style>`
      )
    }
  }

  private createOverlayElement(options: OverlayOptions = {}) {
    const {
      className = '',
      backgroundColor = 'rgba(0, 0, 0, 0.2)',
      zIndex,
      blur = false,
      content = null,
      showSpinner = true,
      spinnerType = 'default',
      position = 'fixed',
    } = options
    const overlayId = `overlay-${++this.overlayCounter}`
    const finalZ = typeof zIndex === 'number' ? zIndex : ZIndexManager.acquire(overlayId)
    const $overlay = (window as any).$(
      `<div id="${overlayId}" class="transition-overlay ${className}" style="position: ${position}; top: 0; left: 0; width: 100%; height: 100%; background-color: ${backgroundColor}; z-index: ${finalZ}; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease-in-out; ${
        blur ? 'backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);' : ''
      }"><div class="overlay-content" style="display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; padding: 16px 36px;">${
        showSpinner ? this.getSpinnerHTML(spinnerType) : ''
      }${content ? `<div class=\"overlay-message\" style=\"margin-top: 16px; font-size: 16px;\">${content}</div>` : ''}</div></div>`
    )
    return { id: overlayId, $overlay }
  }

  /** 显示全局遮罩层 */
  showGlobal(options: OverlayOptions = {}) {
    return new Promise<void>(resolve => {
      if (this.globalOverlay) this.hideGlobal()
      this.injectStyles()
      const defaultOptions: OverlayOptions = {
        position: 'fixed',
        content: '加载中...',
        // 设定一个足够高的默认层级，确保覆盖页面内可能存在的高层级元素（如 9999 的浮层）
        zIndex: typeof options.zIndex === 'number' ? options.zIndex : 11000,
        backgroundColor: options.backgroundColor ?? 'rgba(0, 0, 0, 0.4)',
        ...options,
      }
      const { id, $overlay } = this.createOverlayElement(defaultOptions)
      this.globalOverlay = { el: $overlay, id }
      ;(window as any).$('body').append($overlay)
      ;(window as any).$('body').addClass('overlay-lock-scroll')
      requestAnimationFrame(() => {
        $overlay.addClass('fade-in')
        setTimeout(resolve, 300)
      })
    })
  }

  /** 隐藏全局遮罩层 */
  hideGlobal() {
    return new Promise<void>(resolve => {
      if (!this.globalOverlay) {
        resolve()
        return
      }
      const { el, id } = this.globalOverlay
      el.removeClass('fade-in')
      setTimeout(() => {
        if (this.globalOverlay) {
          el.remove()
          this.globalOverlay = null
          ZIndexManager.release(id)
          ;(window as any).$('body').removeClass('overlay-lock-scroll')
        }
        resolve()
      }, 300)
    })
  }

  /**
   * 在指定容器内显示遮罩层
   * @param target 选择器/元素/jQuery
   */
  showView(target: any, options: OverlayOptions = {}) {
    return new Promise<void>(resolve => {
      const $target = typeof target === 'string' ? (window as any).$(target) : target
      if ($target.length === 0) {
        console.warn('OverlayManager: 目标容器不存在')
        resolve()
        return
      }
      const targetId = $target.attr('id') || `target-${Date.now()}`
      if (!$target.attr('id')) $target.attr('id', targetId)
      if (this.viewOverlays.has(targetId)) this.hideView(target)
      this.injectStyles()
      const originalPosition = $target.css('position')
      if (originalPosition === 'static') $target.css('position', 'relative')
      const defaultOptions: OverlayOptions = { position: 'absolute', content: '加载中...', ...options }
      const { id, $overlay } = this.createOverlayElement(defaultOptions)
      $target.append($overlay)
      this.viewOverlays.set(targetId, { overlay: $overlay, originalPosition, id })
      requestAnimationFrame(() => {
        $overlay.addClass('fade-in')
        setTimeout(resolve, 300)
      })
    })
  }

  /** 隐藏指定容器内的遮罩层 */
  hideView(target: any) {
    return new Promise<void>(resolve => {
      const $target = typeof target === 'string' ? (window as any).$(target) : target
      const targetId = $target.attr('id')
      if (!targetId || !this.viewOverlays.has(targetId)) {
        resolve()
        return
      }
      const { overlay, originalPosition, id } = this.viewOverlays.get(targetId)!
      overlay.removeClass('fade-in')
      setTimeout(() => {
        overlay.remove()
        if (originalPosition === 'static') $target.css('position', '')
        this.viewOverlays.delete(targetId)
        ZIndexManager.release(id)
        resolve()
      }, 300)
    })
  }

  /** 隐藏全局与所有视图遮罩层 */
  hideAll() {
    const promises: Array<Promise<void>> = []
    if (this.globalOverlay) promises.push(this.hideGlobal())
    this.viewOverlays.forEach((_v, targetId) => promises.push(this.hideView(`#${targetId}`)))
    return Promise.all(promises)
  }

  /** 更新遮罩层内部的内容文案 */
  updateContent(content: string, target: any = null) {
    let $overlay: any
    if (target) {
      const $target = typeof target === 'string' ? (window as any).$(target) : target
      const targetId = $target.attr('id')
      if (targetId && this.viewOverlays.has(targetId)) $overlay = this.viewOverlays.get(targetId)!.overlay
    } else {
      $overlay = this.globalOverlay?.el
    }
    if ($overlay) {
      const $message = $overlay.find('.overlay-message')
      if ($message.length > 0) {
        $message.html(content)
      } else {
        $overlay
          .find('.overlay-content')
          .append(`<div class=\"overlay-message\" style=\"margin-top: 16px; font-size: 16px;\">${content}</div>`)
      }
    }
  }

  /** 获取活跃遮罩层统计信息 */
  getActiveOverlays() {
    return {
      global: !!this.globalOverlay,
      views: Array.from(this.viewOverlays.keys()),
      total: (this.globalOverlay ? 1 : 0) + this.viewOverlays.size,
    }
  }
}

/**
 * OverlayManager
 *
 * - showGlobal(options): 显示全局遮罩层
 * - hideGlobal(): 隐藏全局遮罩层
 * - showView(viewSelector, options): 在特定容器（视图）内显示遮罩层
 * - hideView(viewSelector): 隐藏视图遮罩层
 * - hideAll(): 隐藏全局与所有视图遮罩层
 * - updateContent({ target: 'global' | view, content }): 更新遮罩层内部内容
 * - getActiveOverlays(): 获取活跃遮罩层统计信息
 */
export const OverlayManager = new OverlayManagerClass()

// ---------------- Notification（Class） ----------------
type ActiveNotification = { $element: any; config: NotificationConfig; timeoutId: any }

/**
 * 通知管理器
 * - 顶部/底部/居中的消息通知
 */
class NotificationManagerClass {
  private activeNotifications: Map<string, ActiveNotification> = new Map()
  private notificationIdCounter = 0

  private createNotificationContainer(config: {
    id: string
    position?: NotificationConfig['position']
    zIndex?: number
  }) {
    const { id, position = 'center', zIndex = ZIndexManager.acquire(id) } = config
    const positionClasses: Record<string, string> = {
      'top-right': 'top-20 right-6',
      'top-left': 'top-20 left-6',
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-center': 'top-20 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
      center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
    }
    const rendered = renderTemplate('notification-container-template', {
      id,
      positionClass: positionClasses[position],
      zIndex,
    }) as string
    const notificationHtml =
      rendered && rendered.trim().length > 0
        ? rendered
        : `<div id="${id}" class="notification-container fixed ${positionClasses[position]}" style="z-index: ${zIndex}; transition: transform 200ms ease-out, opacity 200ms ease-out; transform: translateY(2rem); opacity: 0;"></div>`
    const $notification = (window as any).$(notificationHtml)
    ;(window as any).$('body').append($notification)
    return $notification
  }

  private createNotificationContent(config: NotificationConfig) {
    const { title = '', message = '', type = 'info', closable = true, icon = '' } = config
    const allowedTypes = ['success', 'error', 'warning', 'info', 'dark'] as const
    type AllowedType = (typeof allowedTypes)[number]
    const typeStyles: Record<
      AllowedType,
      { bgClass: string; textClass: string; iconClass: string; iconColor: string }
    > = {
      success: {
        bgClass: 'bg-green-500',
        textClass: 'text-white',
        iconClass: 'fa-check-circle',
        iconColor: 'text-white',
      },
      error: { bgClass: 'bg-red-500', textClass: 'text-white', iconClass: 'fa-times-circle', iconColor: 'text-white' },
      warning: {
        bgClass: 'bg-yellow-500',
        textClass: 'text-white',
        iconClass: 'fa-exclamation-triangle',
        iconColor: 'text-white',
      },
      info: { bgClass: 'bg-blue-500', textClass: 'text-white', iconClass: 'fa-info-circle', iconColor: 'text-white' },
      dark: { bgClass: 'bg-dark', textClass: 'text-white', iconClass: 'fa-check-circle', iconColor: 'text-green-400' },
    }
    const isAllowed = (t: any): t is AllowedType => (allowedTypes as readonly string[]).includes(t)
    const typeKey: AllowedType = isAllowed(type) ? type : 'info'
    const style = typeStyles[typeKey]
    const finalIcon = icon || style.iconClass
    const rendered = renderTemplate('notification-content-template', {
      bgClass: style.bgClass,
      textClass: style.textClass,
      iconClass: finalIcon,
      iconColor: style.iconColor,
      title,
      message,
      closable,
    }) as string
    if (rendered && rendered.trim().length > 0) return rendered
    return `
  <div class="notification-content ${style.bgClass} ${style.textClass} rounded shadow-lg p-4 flex items-start gap-3">
    <i class="fa ${finalIcon} ${style.iconColor}"></i>
    <div class="flex-1">
      <div class="font-semibold">${title}</div>
      <div>${message}</div>
    </div>
    ${closable ? '<button class="notification-close">×</button>' : ''}
  </div>`
  }

  /**
   * 显示通知
   * @returns notificationId
   */
  show(config: NotificationConfig): string {
    const notificationId = config.id || `notification-${++this.notificationIdCounter}`
    if (this.activeNotifications.has(notificationId)) this.hide(notificationId)
    const $notification = this.createNotificationContainer({
      id: notificationId,
      position: config.position || 'center',
      zIndex: config.zIndex || 50,
    })
    const contentHtml = this.createNotificationContent(config)
    $notification.html(contentHtml)
    $notification.on('click', '.notification-close', () => this.hide(notificationId))
    const notificationData: ActiveNotification = { $element: $notification, config, timeoutId: null }
    this.activeNotifications.set(notificationId, notificationData)
    requestAnimationFrame(() => {
      $notification.removeClass('translate-y-8 opacity-0').addClass('translate-y-0 opacity-100')
    })
    const duration = config.duration !== undefined ? config.duration : 3000
    if (duration > 0) notificationData.timeoutId = setTimeout(() => this.hide(notificationId), duration)
    if (typeof config.onShow === 'function') config.onShow(notificationId)
    return notificationId
  }

  /** 隐藏指定通知 */
  hide(notificationId: string) {
    const notification = this.activeNotifications.get(notificationId)
    if (!notification) return
    const { $element, config, timeoutId } = notification
    if (timeoutId) clearTimeout(timeoutId)
    $element
      .one('transitionend webkitTransitionEnd oTransitionEnd', () => {
        $element.remove()
        this.activeNotifications.delete(notificationId)
        ZIndexManager.release(notificationId)
        if (typeof config.onHide === 'function') config.onHide(notificationId)
      })
      .removeClass('translate-y-0 opacity-100')
      .addClass('translate-y-8 opacity-0')
    setTimeout(() => {
      if (this.activeNotifications.has(notificationId)) {
        $element.remove()
        this.activeNotifications.delete(notificationId)
        ZIndexManager.release(notificationId)
        if (typeof config.onHide === 'function') config.onHide(notificationId)
      }
    }, 400)
  }

  /** 隐藏所有通知 */
  hideAll() {
    this.activeNotifications.forEach((_n, id) => this.hide(id))
  }

  /** 获取当前活跃通知 id 列表 */
  getActiveNotifications(): string[] {
    return Array.from(this.activeNotifications.keys())
  }
}

/**
 * NotificationManager
 *
 * - show(config): 显示通知并返回唯一 `notificationId`
 * - hide(id): 隐藏指定通知
 * - hideAll(): 隐藏当前所有通知
 * - getActiveNotifications(): 获取活跃通知 id 列表
 */
export const NotificationManager = new NotificationManagerClass()

// 统一默认导出（可选）
const UI = { DropdownManager, ModalManager, OverlayManager, NotificationManager }
export default UI

export type ContactServicePopupOptions = {
	triggerSelector?: string
	popupSelector?: string
	closeOnScroll?: boolean
}

/**
 * 将“联系客服”二维码由 hover 改为点击展示的统一绑定函数
 * - 默认选择器：`.contact-service-trigger` 内部查找 `.qr-code-popup`
 * - 行为：点击触发器切换当前弹层显示；点击空白处关闭；可选滚动/缩放时关闭
 */
export function bindContactServicePopupClick(options: ContactServicePopupOptions = {}): void {
	const triggerSelector = options.triggerSelector ?? ".contact-service-trigger"
	const popupSelector = options.popupSelector ?? ".qr-code-popup"
	const closeOnScroll = options.closeOnScroll ?? false

	const $ = (window as any).$
	if (!$) return

	const hideAll = () => {
		$(triggerSelector)
			.find(popupSelector)
			.removeClass("opacity-100 visible")
			.addClass("opacity-0 invisible")
	}

	// 先解绑旧的命名空间事件，避免重复绑定
	$(document).off("click.contactServiceToggle")
	$(document).off("click.contactServiceOutside")
	$(document).off("click.contactServicePopup")
	$(window).off("scroll.contactServiceToggle resize.contactServiceToggle")

	// 触发器点击：切换对应弹层
	$(document).on("click.contactServiceToggle", triggerSelector, function (this: any, e: any) {
		e?.stopPropagation?.()
		const $trigger = $(this)
		const $popup = $trigger.find(popupSelector)
		const isVisible = $popup.hasClass("opacity-100") && !$popup.hasClass("invisible")
		hideAll()
		if (!isVisible) {
			$popup.removeClass("opacity-0 invisible").addClass("opacity-100 visible")
		}
	})

	// 弹层内部点击不冒泡，避免被外层关闭
	$(document).on(
		"click.contactServicePopup",
		`${triggerSelector} ${popupSelector}`,
		function (this: any, e: any) {
			e?.stopPropagation?.()
		}
	)

	// 点击空白区域关闭
	$(document).on("click.contactServiceOutside", function () {
		hideAll()
	})

	// 滚动/窗口变化时关闭（可选）
	if (closeOnScroll) {
		$(window)
			.on("scroll.contactServiceToggle", hideAll)
			.on("resize.contactServiceToggle", hideAll)
	}
}
