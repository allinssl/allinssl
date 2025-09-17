/**
 * 主布局控制器
 * 处理主布局相关的业务逻辑和用户交互
 */

import { useRouter, type RouteRecordRaw } from 'vue-router'
import { useMessage, useDialog, NIcon } from 'naive-ui'
import { h, onMounted, watch } from 'vue'
import router from '@/router'
import { useApp } from './useStore'
import {
	DashboardCustomizeOutlined,
	KeyboardCommandKeySharp,
	ChecklistRtlRound,
	FeaturedPlayListOutlined,
	PlaylistAddCheckOutlined,
	PermIdentityOutlined,
	ReorderOutlined,
	MoneyRound,
	ChromeReaderModeTwotone,
	ShoppingCartOutlined,
	RepeatOutlined,
	InsertDriveFileOutlined,
} from '@vicons/material'
import { ShieldCheckmarkOutline, GlobeOutline } from '@vicons/ionicons5'

import type { MenuOption } from 'naive-ui'

/**
 * 图标映射配置
 */
const iconMap: Record<string, any> = {
	dashboard: DashboardCustomizeOutlined,
	domain: KeyboardCommandKeySharp,
	list: ChecklistRtlRound,
	detail: FeaturedPlayListOutlined,
	'batch-job': PlaylistAddCheckOutlined,
	'batch-register': PlaylistAddCheckOutlined,
	'real-name-auth': PermIdentityOutlined,
	'user-check': PermIdentityOutlined,
	order: ReorderOutlined,
	recharge: MoneyRound,
	'real-name': ChromeReaderModeTwotone,
	'shopping-cart': ShoppingCartOutlined,
	wallet: MoneyRound,
	transfer: RepeatOutlined,
	security: ShieldCheckmarkOutline,
	resolve: GlobeOutline,
	operation: InsertDriveFileOutlined,
}

/**
 * 基于路由配置生成菜单选项
 * @param routes 路由配置数组
 * @param parentPath 父级路径
 * @returns 菜单选项数组
 */
const generateMenuFromRoutes = (routes: RouteRecordRaw[], parentPath = ''): MenuOption[] => {
	const menuOptions: MenuOption[] = []

	routes.forEach((route) => {
		// 跳过隐藏的菜单项和详情页等动态路由
		if (route.meta?.hideInMenu || route.path.includes(':')) {
			return
		}

		const fullPath = parentPath ? `${parentPath}/${route.path}` : route.path
		const cleanPath = fullPath.replace(/\/+/g, '/').replace(/^\/$/, '').replace(/^\//, '')

		const iconKey = (route.meta?.icon as string) || cleanPath.split('/').pop() || ''
		const iconComp = iconMap[iconKey]

		const menuItem: MenuOption = {
			label: route.meta?.title || route.name?.toString() || route.path,
			key: cleanPath || 'dashboard',
			icon: iconComp ? () => h(NIcon, null, { default: () => h(iconComp) }) : undefined,
		}

		// 处理子路由
		if (route.children && route.children.length > 0) {
			const children = generateMenuFromRoutes(route.children, fullPath)
			if (children.length > 0) {
				menuItem.children = children
			}
		}

		menuOptions.push(menuItem)
	})

	return menuOptions
}

/**
 * 生成路由到菜单键的映射
 * @param routes 路由配置数组
 * @param parentPath 父级路径
 * @param parentMenuKey 父级菜单键，用于子路由继承
 * @returns 路由到菜单键的映射对象
 */
const generateRouteToMenuMap = (routes: RouteRecordRaw[], parentPath = '', parentMenuKey = ''): Record<string, string> => {
	const map: Record<string, string> = {}

	routes.forEach((route) => {
		const fullPath = parentPath ? `${parentPath}/${route.path}` : route.path
		const cleanPath = fullPath.replace(/\/+/g, '/').replace(/^\/$/, '').replace(/^\//, '')
		// 修复路径处理逻辑，确保路径以 / 开头
		let routePath = fullPath.replace(/\/+/g, '/')
		if (!routePath.startsWith('/')) {
			routePath = '/' + routePath
		}

		// 如果路由隐藏在菜单中或包含动态参数，使用父级菜单键
		if (route.meta?.hideInMenu || route.path.includes(':')) {
			if (parentMenuKey) {
				map[routePath] = parentMenuKey
			}
			// 对于动态路由，还需要处理不带参数的基础路径
			if (route.path.includes(':')) {
				const baseRoutePath = routePath.replace(/\/:[^/]+/g, '')
				if (baseRoutePath && parentMenuKey) {
					map[baseRoutePath] = parentMenuKey
				}
			}
		} else {
			map[routePath] = cleanPath || 'dashboard'
		}

		// 处理子路由，传递当前菜单键作为父级菜单键
		if (route.children && route.children.length > 0) {
			const currentMenuKey = route.meta?.hideInMenu ? parentMenuKey : (cleanPath || 'dashboard')
			const childMap = generateRouteToMenuMap(route.children, fullPath, currentMenuKey)
			Object.assign(map, childMap)
		}
	})

	return map
}

/**
 * 生成菜单键到路由的映射
 * @param routes 路由配置数组
 * @param parentPath 父级路径
 * @returns 菜单键到路由的映射对象
 */
const generateMenuToRouteMap = (routes: RouteRecordRaw[], parentPath = ''): Record<string, string> => {
	const map: Record<string, string> = {}

	routes.forEach((route) => {
		if (route.meta?.hideInMenu || route.path.includes(':')) {
			return
		}

		const fullPath = parentPath ? `${parentPath}/${route.path}` : route.path
		const cleanPath = fullPath.replace(/\/+/g, '/').replace(/^\/$/, '').replace(/^\//, '')
		// 修复路径处理逻辑，确保路径以 / 开头
		let routePath = fullPath.replace(/\/+/g, '/')
		if (!routePath.startsWith('/')) {
			routePath = '/' + routePath
		}

		map[cleanPath || 'dashboard'] = routePath

		if (route.children && route.children.length > 0) {
			const childMap = generateMenuToRouteMap(route.children, fullPath)
			Object.assign(map, childMap)
		}
	})

	return map
}

// 获取主布局路由的子路由
const mainLayoutRoute = router.getRoutes().find((route) => route.path === '/')
const childRoutes = mainLayoutRoute?.children || []

// 生成菜单选项和映射
const menuOptions = generateMenuFromRoutes(childRoutes)
const routeToMenuMap = generateRouteToMenuMap(childRoutes, '', '')
const menuToRouteMap = generateMenuToRouteMap(childRoutes)

// 路由映射已生成完成

/**
 * 主布局控制器 Hook
 * @returns 布局相关的状态、配置和事件处理方法
 */
export const useMainLayoutController = () => {
	const router = useRouter()
	const message = useMessage()
	const dialog = useDialog()

	// 获取状态管理
	const {
		sidebarCollapsed,
		activeMenuKey,
		userInfo,
		unreadCount,
		notifications,
		scrollbarContentRef,
		isMobile,
		mobileMenuVisible,
		mobileBottomMenuVisible,
		setActiveMenuKey,
		setNotifications,
		toggleMobileMenu,
		setMobileMenuVisible,
		toggleMobileBottomMenu,
		setMobileBottomMenuVisible,
		initMobileDetection,
		cleanupMobileDetection,
	} = useApp()

	/**
	 * 处理菜单选择
	 * @param key 菜单键
	 */
	const handleMenuSelect = (key: string) => {
		console.log(key)
		setActiveMenuKey(key)
		// 外部页面：充值管理 / 实名认证
		// if (key.includes('recharge')) {
		// 	window.open('https://www.bt.cn/admin/recharge', '_blank')
		// 	return
		// }
		// if (key.includes('real-name-auth')) {
		// 	window.open('https://www.bt.cn/admin/userinfo', '_blank')
		// 	return
		// }
		if (key.includes('batch-register')) {
			window.open('https://www.bt.cn/new/domain-register.html', '_blank')
			return
		}

		const routePath = menuToRouteMap[key]
		if (routePath) {
			router.push(routePath)
		}
	}

	/**
	 * 处理返回官网
	 */
	const handleBackToOfficial = (isAdmin = false) => {
		window.open('https://www.bt.cn/' + (isAdmin ? 'admin' : ''), '_blank')
	}

	/**
	 * 处理Logo点击
	 */
	const handleLogoClick = () => {
		router.push('/')
	}

	/**
 * 根据当前路由更新活跃菜单
 */
const updateActiveMenuFromRoute = () => {
	const currentPath = router.currentRoute.value.path
	let menuKey = routeToMenuMap[currentPath]

	// 如果直接匹配失败，尝试匹配父级路由
	if (!menuKey) {
		// 尝试匹配动态路由的基础路径
		for (const [routePath, key] of Object.entries(routeToMenuMap)) {
			// 处理动态路由参数匹配
			if (routePath.includes(':')) {
				const routePattern = routePath.replace(/\/:[^/]+/g, '/[^/]+')
				const regex = new RegExp(`^${routePattern}$`)
				if (regex.test(currentPath)) {
					menuKey = key
					break
				}
			}
		}
	}

	// 如果仍然没有匹配到，尝试匹配路径的父级
	if (!menuKey) {
		// 逐级向上查找父级路径
		const pathSegments = currentPath.split('/').filter(Boolean)
		for (let i = pathSegments.length - 1; i > 0; i--) {
			const parentPath = '/' + pathSegments.slice(0, i).join('/')
			if (routeToMenuMap[parentPath]) {
				menuKey = routeToMenuMap[parentPath]
				break
			}
		}
	}

	// 最终回退到默认值
	menuKey = menuKey || 'dashboard'
	setActiveMenuKey(menuKey)
}

	/**
	 * 处理移动端菜单切换
	 */
	const handleMobileMenuToggle = () => {
		toggleMobileMenu()
	}

	/**
	 * 处理移动端底部菜单切换
	 */
	const handleMobileBottomMenuToggle = () => {
		toggleMobileBottomMenu()
	}

	/**
	 * 初始化移动端检测
	 */
	const initMobile = () => {
		initMobileDetection()
	}

	/**
	 * 清理移动端检测
	 */
	const cleanupMobile = () => {
		cleanupMobileDetection()
	}

	// 监听路由变化
	watch(
		() => router.currentRoute.value.path,
		() => {
			updateActiveMenuFromRoute()
		},
		{ immediate: true },
	)

	// 组件挂载时初始化数据
	onMounted(() => {
		updateActiveMenuFromRoute()
	})

	return {
		// 状态
		state: {
			sidebarCollapsed,
			scrollbarContentRef,
			activeMenuKey,
			userInfo,
			unreadCount,
			notifications,
			isMobile,
			mobileMenuVisible,
			mobileBottomMenuVisible,
		},
		// 配置
		menuOptions,
		// 事件处理方法
		handleMenuSelect,
		handleBackToOfficial,
		handleLogoClick,
		handleMobileMenuToggle,
		handleMobileBottomMenuToggle,
		initMobile,
		cleanupMobile,
	}
}
