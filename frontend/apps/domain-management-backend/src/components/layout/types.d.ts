/**
 * 主布局相关类型定义
 */

/**
 * 用户信息接口
 */
export interface IUserInfo {
  /** 用户ID */
  id: string
  /** 用户名 */
  name: string
  /** 邮箱 */
  email: string
  /** 头像URL */
  avatar?: string
  /** 用户角色 */
  role?: 'admin' | 'user' | 'guest'
}

/**
 * 为了保持向后兼容性，保留原有类型名
 * @deprecated 请使用 IUserInfo
 */
export type UserInfo = IUserInfo

/**
 * 菜单项接口
 */
export interface IMenuItem {
  /** 菜单标签 */
  label: string
  /** 菜单键值 */
  key: string
  /** 图标 */
  icon?: string
  /** 路由路径 */
  path?: string
  /** 子菜单 */
  children?: IMenuItem[]
  /** 是否隐藏 */
  hidden?: boolean
  /** 权限要求 */
  roles?: string[]
}

/**
 * 为了保持向后兼容性，保留原有类型名
 * @deprecated 请使用 IMenuItem
 */
export type MenuItem = IMenuItem

/**
 * 通知消息接口
 */
export interface INotificationItem {
  /** 消息ID */
  id: string
  /** 消息标题 */
  title: string
  /** 消息内容 */
  content: string
  /** 消息类型 */
  type: 'info' | 'success' | 'warning' | 'error'
  /** 是否已读 */
  read: boolean
  /** 消息时间 */
  time?: string
  /** 创建时间 */
  createdAt: string
}
