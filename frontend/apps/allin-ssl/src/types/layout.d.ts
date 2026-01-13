/**
 * @file 布局组件类型定义文件
 * @description 此文件包含布局组件及相关接口的 TypeScript 类型定义，
 *              包括布局属性、系统信息、公司信息、菜单项以及布局状态管理等类型定义。
 * @module views/layout/types
 */

import type { VNode, Ref, ComputedRef, Component } from 'vue'
import type { MenuOption } from 'naive-ui/es/menu/src/interface' // 确保路径正确
import type { RouteRecordRaw } from 'vue-router'
// 假设 DnsProviderOption 和 NotifyProviderOption 定义在 src/types/setting.d.ts
import type { DnsProviderOption, NotifyProviderOption } from './setting'

/**
 * 布局组件的Props接口定义
 * @interface LayoutProps
 * @property {VNode[]} [children] - 子节点列表
 */
export interface LayoutProps {
	children?: VNode[]
}

/**
 * 系统信息接口定义
 * @interface SystemInfo
 * @property {string} username - 用户名
 * @property {string} version - 系统版本号
 * @property {string} secret -密钥
 * @property {string} id - 用户ID
 * @property {string} server_id - 服务器ID
 * @property {string} uid - UID
 */
export interface SystemInfo {
	username: string
	version: string
	secret: string
	id: string
	server_id: string
	uid: string
}

/**
 * 支付信息接口定义
 * @interface PayAuthInfo
 * @property {string} auth - 支付类型
 * @property {number} count - 支付数量
 * @property {number} endtime - 支付结束时间 (时间戳)
 */
export interface PayAuthInfo {
	auth: string
	count: number
	endtime: number
}

/**
 * 更新信息接口定义
 * @interface UpdateInfo
 * @property {string} currentVersion - 当前版本
 * @property {string} currentVersionDate - 当前版本发布时间
 * @property {string} newVersion - 新版本
 * @property {string} newVersionDate - 新版本发布时间
 * @property {string[]} upgradeLog - 更新日志
 */
export interface UpdateInfo {
	currentVersion: string
	currentVersionDate: string
	newVersion: string
	newVersionDate: string
	upgradeLog: string[]
}

/**
 * 公司信息接口定义
 * @interface CompanyInfo
 * @property {string} name - 公司名称
 * @property {string} copyright - 版权信息
 * @property {string} year - 年份
 */
export interface CompanyInfo {
	name: string
	copyright: string
	year: string
}

/**
 * 菜单项接口定义 (自定义，可能与 Naive UI 的 MenuOption 不同)
 * @interface MenuItem
 * @property {string} key - 菜单项唯一标识
 * @property {() => VNode} [icon] - 菜单图标渲染函数
 * @property {string} label - 菜单显示文本
 * @property {MenuItem[]} [children] - 子菜单项列表
 * @property {string} [path] - 菜单路由路径
 */
export interface MenuItem {
	key: string
	icon?: () => VNode
	label: string
	children?: MenuItem[]
	path?: string
}

/**
 * @description 路由名称类型定义
 */
export type RouteName =
  | "logout"
  | "settings"
  | "home"
  | "monitor"
  | "certApply"
  | "privateCaManage"
  | "autoDeploy"
  | "authApiManage"
  | "certManage"
  | "privateCaCert";

// 新增类型定义 - 从 useStore.tsx 迁移
/**
 * 推送源类型项接口定义
 * @interface PushSourceTypeItem
 * @property {string} name - 名称
 */
export interface PushSourceTypeItem {
	name: string
}

// 新增类型定义 - 从 useController.tsx 迁移
/**
 * @description 图标映射类型
 */
export type IconMap = Record<RouteName, Component>

// 新增/替换的 Store 相关类型 - 基于 useStore.tsx 的 LayoutStoreExposes
/**
 * 布局 Store 接口定义
 * @interface LayoutStoreInterface
 */
export interface LayoutStoreInterface {
	isCollapsed: Ref<boolean>
	notifyProvider: Ref<NotifyProviderOption[]>
	dnsProvider: Ref<DnsProviderOption[]>
	menuActive: Ref<RouteName>
	layoutPadding: ComputedRef<string>
	locales: Ref<string>
	pushSourceType: Ref<Record<string, PushSourceTypeItem>>
	toggleCollapse: () => void
	handleCollapse: () => void
	handleExpand: () => void
	updateMenuActive: (active: RouteName) => void
	resetDataInfo: () => void
	fetchNotifyProvider: () => Promise<void>
	fetchDnsProvider: (type?: string) => Promise<void>
	resetDnsProvider: () => void
}

// 新增类型定义 - 从 useController.tsx 迁移
/**
 * 布局 Controller 暴露的接口定义
 * @interface LayoutControllerExposes
 */
export interface LayoutControllerExposes {
	isCollapsed: Ref<boolean>
	menuActive: Ref<RouteName>
	updateMenuActive: (active: RouteName) => void
	toggleCollapse: () => void
	handleCollapse: () => void
	handleExpand: () => void
	resetDataInfo: () => void
	handleLogout: () => Promise<void>
	menuItems: ComputedRef<MenuOption[]>
	isChildRoute: Ref<boolean>
	childRouteConfig: Ref<Partial<RouteRecordRaw>>
}
