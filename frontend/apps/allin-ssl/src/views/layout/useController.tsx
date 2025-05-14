import { NIcon } from 'naive-ui'
import { RouterLink, useRoute } from 'vue-router'
import { useMessage, useDialog } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { signOut } from '@api/public'
import { routes } from '@router/index'
import { $t } from '@locales/index'
import { useStore } from './useStore'

import { SettingsOutline, LogOutOutline } from '@vicons/ionicons5'
import { CloudMonitoring, Home, Flow } from '@vicons/carbon'
import { Certificate20Regular, AddSquare24Regular } from '@vicons/fluent'
import { ApiOutlined } from '@vicons/antd'

import type { MenuOption } from 'naive-ui/es/menu/src/interface'
import type { RouteName } from './types'

/**
 * @description 图标映射类型
 */
type IconMap = Record<RouteName, Component>

/**
 * @description 布局控制器
 * @returns 返回布局相关状态和方法
 */
export const useController = () => {
	const store = useStore()
	const router = useRouter()
	const route = useRoute()
	const message = useMessage()
	// const { useFormInput } = useFormHooks()
	const { handleError } = useError()
	const { resetDataInfo, menuActive, updateMenuActive } = store

	/**
	 * 当前路由是否为子路由
	 */
	const isChildRoute = ref(false)

	/**
	 * 当前子路由配置
	 */
	const childRouteConfig = ref<Record<string, any>>({})

	/**
	 * ==================== 弹窗相关功能 ====================
	 */

	// ==============================
	// 图标渲染方法
	// ==============================

	/**
	 * @description 渲染导航图标
	 * @param name - 路由名称
	 * @returns 对应的图标组件
	 */
	const renderIcon = (name: RouteName) => {
		const iconObj: IconMap = {
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
	const menuItems = computed(() => {
		const routeMenuItems: MenuOption[] = routes.map((route) => ({
			key: route.name as RouteName,
			label: () => <RouterLink to={route.path}>{route?.meta?.title as string}</RouterLink>,
			icon: renderIcon(route.name as RouteName),
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
	const checkIsChildRoute = () => {
		// 获取当前路由路径
		const currentPath = route.path
		// 检查路由是否包含 /children/ 标识子路由
		isChildRoute.value = currentPath.includes('/children/')

		// 如果是子路由，获取子路由配置
		if (isChildRoute.value) {
			// 获取当前激活的主路由
			const parentRoute = routes.find((route) => route.name === menuActive.value)
			// 如果找到了父路由，且父路由有子路由配置
			if (parentRoute && parentRoute.children) {
				// 查找当前的子路由
				const currentChild = parentRoute.children.find((child) => route.path.includes(child.path))
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
		() => {
			if (route.name !== menuActive.value) {
				// 更新当前激活的菜单项
				updateMenuActive(route.name as RouteName)
			}
			// 检查是否为子路由
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
	const handleLogout = async () => {
		try {
			await useDialog({
				title: $t('t_15_1745457484292'),
				content: $t('t_16_1745457491607'),
				onPositiveClick: async () => {
					try {
						message.success($t('t_17_1745457488251'))
						await signOut().fetch()
						setTimeout(() => {
							// 重置数据信息
							resetDataInfo()
							// 删除会话存储
							sessionStorage.clear()
							// 路由跳转
							router.push('/login')
						}, 1000)
					} catch (error) {
						handleError(error)
					}
				},
			})
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * ==================== 初始化逻辑 ====================
	 */

	onMounted(async () => {
		// 初始化时检查是否为子路由
		checkIsChildRoute()
	})

	return {
		...store,
		handleLogout,
		menuItems,
		isChildRoute,
		childRouteConfig,
	}
}
