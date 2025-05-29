// 外部库依赖
import { ref, computed, watch, onMounted, h } from 'vue' // 从 vue 导入
import { NIcon } from 'naive-ui'
import { RouterLink, useRoute, useRouter, type RouteRecordRaw } from 'vue-router'

// 类型导入 - 从全局类型文件导入
import type { MenuOption } from 'naive-ui/es/menu/src/interface'
import type {
	RouteName,
	IconMap, // 导入 IconMap
	LayoutControllerExposes, // 导入 LayoutControllerExposes
} from '../../types/layout' // 调整路径

// 内部模块导入 - Hooks
import { useMessage, useDialog } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
// 内部模块导入 - API
import { signOut } from '@api/public'
// 内部模块导入 - Store
import { useStore } from './useStore'
// 内部模块导入 - 配置
import { routes } from '@router/index' // 假设 routes 是 RouteRecordRaw[]
// 内部模块导入 - 工具函数
import { $t } from '@locales/index'

// 图标导入
import { SettingsOutline, LogOutOutline } from '@vicons/ionicons5'
import { CloudMonitoring, Home, Flow } from '@vicons/carbon'
import { Certificate20Regular, AddSquare24Regular } from '@vicons/fluent'
import { ApiOutlined } from '@vicons/antd'


/**
 * @description 布局控制器
 * @returns 返回布局相关状态和方法
 */
export const useController = (): LayoutControllerExposes => { // 使用导入的 LayoutControllerExposes
	const store = useStore()
	const router = useRouter() // 从 vue-router 导入
	const route = useRoute()
	const message = useMessage()
	const { handleError } = useError()
	// 从 store 中解构需要的状态和方法
	const { isCollapsed, menuActive, updateMenuActive, toggleCollapse, handleCollapse, handleExpand, resetDataInfo } = store

	/**
	 * 当前路由是否为子路由
	 */
	const isChildRoute = ref(false)

	/**
	 * 当前子路由配置
	 */
	const childRouteConfig = ref<Partial<RouteRecordRaw>>({}) // 替换 any

	/**
	 * ==================== 弹窗相关功能 ====================
	 */
	// (此处无弹窗相关功能直接定义，而是通过 useDialog hook 使用)

	// ==============================
	// 图标渲染方法
	// ==============================

	/**
	 * @description 渲染导航图标
	 * @param name - 路由名称
	 * @returns 对应的图标组件
	 */
	const renderIcon = (name: RouteName) => {
		const iconObj: IconMap = { // IconMap 类型来自导入
			certManage: Certificate20Regular,
			autoDeploy: Flow,
			home: Home,
			certApply: AddSquare24Regular,
			monitor: CloudMonitoring,
			settings: SettingsOutline,
			logout: LogOutOutline,
			authApiManage: ApiOutlined,
		}
		return () => h(NIcon, null, () => h(iconObj[name] || 'div'))
	}

	// ==============================
	// 菜单相关方法
	// ==============================
	const menuItems = computed<MenuOption[]>(() => { // 添加显式返回类型
		const routeMenuItems: MenuOption[] = routes
			.filter((r) => r.meta?.title) // 过滤掉没有 title 的路由，避免渲染空标签
			.map((r) => ({
				key: r.name as RouteName,
				label: () => <RouterLink to={r.path}>{r?.meta?.title as string}</RouterLink>,
				icon: renderIcon(r.name as RouteName),
			}))
		return [
			...routeMenuItems,
			{
				key: 'logout',
				label: () => <a onClick={handleLogout}>{$t('t_15_1745457484292')}</a>,
				icon: renderIcon('logout'),
			},
		]
	})

	/**
	 * @description 检查当前路由是否为子路由
	 * @returns {void}
	 */
	const checkIsChildRoute = (): void => {
		const currentPath = route.path
		isChildRoute.value = currentPath.includes('/children/')

		if (isChildRoute.value) {
			const parentRoute = routes.find((r) => r.name === menuActive.value)
			if (parentRoute && parentRoute.children) {
				const currentChild = parentRoute.children.find((child: RouteRecordRaw) => route.path.includes(child.path))
				childRouteConfig.value = currentChild || {}
			} else {
				childRouteConfig.value = {}
			}
		} else {
			childRouteConfig.value = {}
		}
	}

	watch(
		() => route.name,
		(newName) => { // route.name 可能为 null 或 undefined
			if (newName && newName !== menuActive.value) {
				updateMenuActive(newName as RouteName)
			}
			checkIsChildRoute()
		},
		{ immediate: true },
	)

	/**
	 * ==================== 用户操作功能 ====================
	 */

	/**
	 * @description 退出登录
	 * @returns {Promise<void>}
	 */
	const handleLogout = async (): Promise<void> => {
		try {
			await useDialog({
				title: $t('t_15_1745457484292'),
				content: $t('t_16_1745457491607'),
				onPositiveClick: async () => {
					try {
						message.success($t('t_17_1745457488251'))
						await signOut().fetch()
						setTimeout(() => {
							resetDataInfo()
							sessionStorage.clear()
							router.push('/login')
						}, 1000)
					} catch (error) {
						handleError(error)
					}
				},
			})
		} catch (error) {
			// useDialog 拒绝时会抛出错误，这里可以捕获不处理，或者记录日志
			// handleError(error) // 如果 useDialog 的拒绝也需要统一处理
		}
	}

	/**
	 * ==================== 初始化逻辑 ====================
	 */

	onMounted(async () => {
		checkIsChildRoute()
	})

	return {
		// 从 store 暴露
		isCollapsed,
		menuActive,
		updateMenuActive,
		toggleCollapse,
		handleCollapse,
		handleExpand,
		resetDataInfo,
		// controller 自身逻辑
		handleLogout,
		menuItems,
		isChildRoute,
		childRouteConfig,
	}
}
