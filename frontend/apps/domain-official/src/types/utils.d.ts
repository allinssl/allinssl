// 放置在当前目录的类型声明文件，供 JS/TS 消费者使用

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
export type ModalButtonType = 'primary' | 'secondary' | 'danger' | 'default'

export interface ModalButtonConfig {
  id?: string
  text: string
  type?: ModalButtonType
  className?: string
  onClick?: string
}

export interface ModalConfig {
  id?: string
  className?: string
  zIndex?: number
  title?: string
  content?: string
  size?: ModalSize
  closable?: boolean
  maskClose?: boolean
  buttons?: ModalButtonConfig[]
  onShow?: (id: string) => void
  onHide?: (id: string) => void
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'dark'
export type NotificationPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center'
  | 'center'

export interface NotificationConfig {
  id?: string
  position?: NotificationPosition
  zIndex?: number
  title?: string
  message?: string
  type?: NotificationType
  closable?: boolean
  icon?: string
  duration?: number
  onShow?: (id: string) => void
  onHide?: (id: string) => void
}

export type DropdownOptionPrimitive = string | number

export interface DropdownOptionStruct {
  value: any
  label: string
  disabled?: boolean
  className?: string
  [key: string]: any
}

export interface DropdownOptionMap {
  /** 选项值字段名，默认 'value'（对象输入时生效） */
  value?: string
  /** 选项显示文本字段名，默认 'label' | 'text'（对象输入时生效） */
  label?: string
  /** 是否禁用字段名，默认 'disabled'（对象输入时生效） */
  disabled?: string
  /** 自定义样式类字段名，默认 'className'（对象输入时生效） */
  className?: string
}

export interface DropdownShowConfig<T = any, O extends Record<string, any> = any> {
  id?: string
  trigger: any
  /**
   * 直接传入 HTML 字符串内容（兼容旧用法）。如传入 `options`，该字段可省略。
   */
  content?: string
  className?: string
  zIndex?: number
  onSelect?: (value: any, text: string, data: T) => void
  data?: T
  /**
   * 动态选项数组：可为原始值（string/number）或对象。
   * 对象时可通过 `optionMap` 指定字段映射。
   */
  options?: Array<DropdownOptionPrimitive | O>
  /**
   * 自定义字段映射（当 `options` 为对象数组时有效）。
   */
  optionMap?: DropdownOptionMap
  /**
   * 自定义选项渲染函数。若提供，将用其返回的 HTML 渲染每一项。
   */
  optionRender?: (normalized: DropdownOptionStruct, raw: DropdownOptionPrimitive | O, index: number) => string
}

export type SpinnerType = 'default' | 'dots' | 'pulse'

export interface OverlayOptions {
  className?: string
  backgroundColor?: string
  zIndex?: number
  blur?: boolean
  content?: string | null
  showSpinner?: boolean
  spinnerType?: SpinnerType
  position?: 'fixed' | 'absolute'
}

export interface ContactServicePopupOptions {
  triggerSelector?: string
  popupSelector?: string
  closeOnScroll?: boolean
}
