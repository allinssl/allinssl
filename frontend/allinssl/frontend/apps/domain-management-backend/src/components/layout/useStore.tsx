/**
 * 主布局状态管理
 * 管理主布局相关的响应式数据和应用全局状态
 */

import { defineStore, storeToRefs } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { IUserInfo, INotificationItem } from './types'

/**
 * 应用全局状态管理 Store
 * @description 使用 Pinia 管理应用全局状态和布局状态
 */
export const useAppStore = defineStore(
	'app-store',
	() => {
		// ==================== 应用全局状态定义 ====================

		/** 应用标题 */
		const appTitle = ref('宝塔域名管理系统')

		/** 侧边栏折叠状态 */
		const sidebarCollapsed = ref<boolean>(false)

		/** 主题模式 */
		const theme = ref<'light' | 'dark'>('light')

		/** 语言设置 */
		const locale = ref('zh-CN')

		/** 加载状态 */
		const globalLoading = ref(false)

		/** 面包屑导航 */
		const breadcrumbs = ref<Array<{ title: string; path: string; name?: string }>>([])

		/** 应用加载状态 */
		const appLoading = ref(false)

		// ==================== 布局相关状态定义 ====================

		/** 当前活跃的菜单项 */
		const activeMenuKey = ref<string>('dashboard')

		/** 用户信息 */
		const userInfo = ref<IUserInfo | null>(null)

		/** 未读消息数量 */
		const unreadCount = ref<number>(0)

		/** 通知列表 */
		const notifications = ref<INotificationItem[]>([])

		/** 滚动条内容区域引用 */
		const scrollbarContentRef = ref<HTMLDivElement>()

		// ==================== 移动端相关状态定义 ====================

		/** 是否为移动端设备 */
		const isMobile = ref<boolean>(false)

		/** 移动端菜单是否可见 */
		const mobileMenuVisible = ref<boolean>(false)

		/** 移动端底部菜单是否可见 */
		const mobileBottomMenuVisible = ref<boolean>(false)

		// ==================== 计算属性 ====================

		/** 是否为暗色主题 */
		const isDarkTheme = computed(() => theme.value === 'dark')

		/** 移动端断点检测 */
		const checkMobile = () => {
			isMobile.value = window.innerWidth < 768
		}

		/** 监听窗口大小变化 */
		const handleResize = () => {
			checkMobile()
			// 如果切换到桌面端，关闭移动端菜单
			if (!isMobile.value) {
				mobileMenuVisible.value = false
				mobileBottomMenuVisible.value = false
			}
		}

		// ==================== 应用全局方法定义 ====================

		/**
		 * 切换侧边栏折叠状态
		 */
		const toggleSidebar = (): void => {
			sidebarCollapsed.value = !sidebarCollapsed.value
		}

		/**
		 * 设置侧边栏折叠状态
		 * @param {boolean} collapsed 折叠状态
		 */
		const setSidebarCollapsed = (collapsed: boolean): void => {
			sidebarCollapsed.value = collapsed
		}

		/**
		 * 切换主题
		 */
		const toggleTheme = (): void => {
			theme.value = theme.value === 'light' ? 'dark' : 'light'
		}

		/**
		 * 设置主题
		 * @param {string} newTheme 主题名称
		 */
		const setTheme = (newTheme: 'light' | 'dark'): void => {
			theme.value = newTheme
		}

		/**
		 * 设置语言
		 * @param {string} newLocale 语言代码
		 */
		const setLocale = (newLocale: string): void => {
			locale.value = newLocale
		}

		/**
		 * 设置全局加载状态
		 * @param {boolean} loading 加载状态
		 */
		const setGlobalLoading = (loading: boolean): void => {
			globalLoading.value = loading
		}

		/**
		 * 设置应用标题
		 * @param {string} title 应用标题
		 */
		const setAppTitle = (title: string): void => {
			appTitle.value = title
		}

		/**
		 * 设置面包屑导航
		 * @param {Array} crumbs 面包屑数组
		 */
		const setBreadcrumbs = (crumbs: Array<{ title: string; path: string; name?: string }>): void => {
			breadcrumbs.value = crumbs
		}

		/**
		 * 设置应用加载状态
		 * @param {boolean} loading 加载状态
		 */
		const setAppLoading = (loading: boolean): void => {
			appLoading.value = loading
		}

		// ==================== 布局相关方法定义 ====================

		/**
		 * 设置活跃菜单项
		 * @param {string} key 菜单键值
		 */
		const setActiveMenuKey = (key: string): void => {
			activeMenuKey.value = key
		}

		/**
		 * 设置通知列表
		 * @param {INotificationItem[]} items 通知列表
		 */
		const setNotifications = (items: INotificationItem[]): void => {
			notifications.value = items
		}

		// ==================== 移动端相关方法定义 ====================

		/**
		 * 切换移动端菜单显示状态
		 */
		const toggleMobileMenu = (): void => {
			mobileMenuVisible.value = !mobileMenuVisible.value
			// 关闭底部菜单
			if (mobileMenuVisible.value) {
				mobileBottomMenuVisible.value = false
			}
		}

		/**
		 * 设置移动端菜单显示状态
		 * @param {boolean} visible 显示状态
		 */
		const setMobileMenuVisible = (visible: boolean): void => {
			mobileMenuVisible.value = visible
		}

		/**
		 * 切换移动端底部菜单显示状态
		 */
		const toggleMobileBottomMenu = (): void => {
			mobileBottomMenuVisible.value = !mobileBottomMenuVisible.value
			// 关闭侧边菜单
			if (mobileBottomMenuVisible.value) {
				mobileMenuVisible.value = false
			}
		}

		/**
		 * 设置移动端底部菜单显示状态
		 * @param {boolean} visible 显示状态
		 */
		const setMobileBottomMenuVisible = (visible: boolean): void => {
			mobileBottomMenuVisible.value = visible
		}

		/**
		 * 初始化移动端检测
		 */
		const initMobileDetection = (): void => {
			checkMobile()
			window.addEventListener('resize', handleResize)
		}

		/**
		 * 清理移动端检测
		 */
		const cleanupMobileDetection = (): void => {
			window.removeEventListener('resize', handleResize)
		}

		return {
			// 应用全局状态
			appTitle,
			sidebarCollapsed,
			theme,
			locale,
			globalLoading,
			breadcrumbs,
			appLoading,

			// 布局相关状态
			activeMenuKey,
			userInfo,
			unreadCount,
			notifications,
			scrollbarContentRef,

			// 移动端相关状态
			isMobile,
			mobileMenuVisible,
			mobileBottomMenuVisible,

			// 计算属性
			isDarkTheme,

			// 应用全局方法
			toggleSidebar,
			setSidebarCollapsed,
			toggleTheme,
			setTheme,
			setLocale,
			setGlobalLoading,
			setAppTitle,
			setBreadcrumbs,
			setAppLoading,

			// 布局相关方法
			setActiveMenuKey,
			setNotifications,

			// 移动端相关方法
			toggleMobileMenu,
			setMobileMenuVisible,
			toggleMobileBottomMenu,
			setMobileBottomMenuVisible,
			initMobileDetection,
			cleanupMobileDetection,
		}
	},
	{
		persist: true,
	},
)

/**
 * 组合式 API 使用 App Store
 * @description 提供对应用 Store 的访问，并返回响应式引用
 * @returns {Object} 包含所有 store 状态和方法的对象
 */
export const useApp = () => {
	const store = useAppStore()
	return { ...store, ...storeToRefs(store) }
}

/**
 * 主布局状态管理 Hook（向后兼容）
 * @deprecated 请使用 useApp 替代
 * @returns 布局相关的响应式状态和操作方法
 */
export const useMainLayoutState = () => {
	return useApp()
}
