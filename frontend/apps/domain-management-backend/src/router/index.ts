/**
 * 路由配置
 */

import { createRouter, createWebHistory, type RouteRecordRaw, type RouteLocationNormalized } from 'vue-router'

import { useApp } from '@/components/layout/useStore'
import { createDiscreteApi } from 'naive-ui'

// 页面组件懒加载
const Dashboard = () => import('../views/dashboard/index')
const DomainList = () => import('../views/domain/index')
const DomainDetail = () => import('../views/domain-details/index')
const BatchRegister = () => import('../views/batch-register/index')
const DomainTransfer = () => import('../views/transfer/index')
const RealNameTemplate = () => import('../views/real-name/index')
const RealNameCenter = () => import('../views/real-name-center/index')
const RechargeManage = () => import('../views/recharge/index')
const OrderList = () => import('../views/order/index')
const DomainSecurity = () => import('../views/domain-security/index')
const DomainResolve = () => import('../views/domain-resolve/index')
const OperationLog = () => import('../views/operation-log/index')

// 主布局组件
const MainLayout = () => import('@components/layout/index')

const { loadingBar } = createDiscreteApi(['loadingBar'])

// 路由配置
const routes: RouteRecordRaw[] = [
	{
		path: '/',
		component: MainLayout,
		redirect: '/dashboard',
		children: [
			{
				path: 'dashboard',
				name: 'Dashboard',
				component: Dashboard,
				meta: {
					title: '主页',
					icon: 'dashboard',
				},
			},
			{
				path: 'domain',
				name: 'Domain',
				redirect: '/domain/list',
				meta: {
					title: '域名管理',
					icon: 'domain',
					requiresAuth: true,
				},
				children: [
					{
						path: 'list',
						name: 'DomainList',
						component: DomainList,
						meta: {
							title: '域名列表',
							icon: 'list',
							requiresAuth: true,
						},
					},
					{
						path: 'detail/:id',
						name: 'DomainDetail',
						component: DomainDetail,
						meta: {
							title: '域名详情',
							icon: 'detail',
							requiresAuth: true,
							hideInMenu: true,
						},
					},
					{
						path: 'batch-register',
						name: 'BatchRegister',
						component: BatchRegister,
						meta: {
							title: '注册域名',
							icon: 'batch-job',
							requiresAuth: true,
						},
					},
					{
						path: 'transfer',
						name: 'DomainTransfer',
						component: DomainTransfer,
						meta: {
							title: '域名转入',
							icon: 'transfer',
							requiresAuth: true,
						},
					},
				],
			},
			{
				path: 'domain-resolve',
				name: 'DomainResolve',
				component: DomainResolve,
				meta: {
					title: '域名解析',
					icon: 'resolve',
				},
				children: [
					{
						path: 'detail/:id',
						name: 'DomainResolveDetail',
						component: () => import('../views/domain-resolve/components/DomainResolveDetail'),
						meta: {
							title: '域名解析详情',
							icon: 'resolve',
							hideInMenu: true,
						},
					},
				],
			},
			{
				path: 'real-name',
				name: 'RealNameTemplate',
				component: RealNameTemplate,
				meta: {
					title: '实名信息模板',
					icon: 'real-name',
				},
			},

			{
				path: 'order',
				name: 'OrderList',
				component: OrderList,
				meta: {
					title: '我的订单',
					icon: 'shopping-cart',
				},
			},
			{
				path: 'recharge',
				name: 'RechargeManage',
				component: RechargeManage,
				meta: {
					title: '充值管理',
					icon: 'wallet',
					requiresAuth: true,
				},
			},
			{
				path: 'real-name-auth',
				name: 'RealNameCenter',
				component: RealNameCenter,
				meta: {
					title: '实名认证',
					icon: 'user-check',
				},
			},
			{
				path: 'domain-security',
				name: 'DomainSecurity',
				component: DomainSecurity,
				meta: {
					title: '域名安全',
					icon: 'security',
				},
			},
			{
				path: 'operation-log',
				name: 'OperationLog',
				component: OperationLog,
				meta: {
					title: '操作日志',
					icon: 'operation',
				},
			},
		],
	},
]

// 创建路由实例
const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL + 'domain'), // 自定义的前缀
	routes,
	scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition
		} else {
			return { top: 0 }
		}
	},
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
	const { setAppTitle, setBreadcrumbs } = useApp()
	// 设置页面标题
	if (to.meta.title) {
		document.title = `堡塔域名管理 - ${to.meta.title}`
		setAppTitle(to.meta.title as string)
	}
	loadingBar.start()
	// 设置面包屑
	const breadcrumbs = generateBreadcrumbs(to)
	setBreadcrumbs(breadcrumbs)

	next()
})

router.afterEach((to, from) => {
	const { setAppLoading } = useApp()
	// 页面加载完成
	setAppLoading(false)
	loadingBar.finish()
})

// 全局路由错误处理
router.onError((error) => {
	console.warn('Vue Router navigation error:', error)
	// 可以在这里添加更多的错误处理逻辑，比如显示错误提示
})

/**
 * 生成面包屑导航
 * @param {RouteLocationNormalized} route 路由对象
 * @returns {Array} 面包屑数组
 */
function generateBreadcrumbs(route: RouteLocationNormalized): Array<{ title: string; path: string; name?: string }> {
	const breadcrumbs: Array<{ title: string; path: string; name?: string }> = []
	const matched = route.matched

	for (const match of matched) {
		if (match.meta.title && !match.meta.hideInMenu) {
			breadcrumbs.push({
				title: match.meta.title as string,
				path: match.path,
				name: typeof match.name === 'string' ? match.name : undefined,
			})
		}
	}

	return breadcrumbs
}

export default router

// 路由元信息类型扩展
declare module 'vue-router' {
	interface RouteMeta {
		title?: string
		icon?: string
		requiresAuth?: boolean
		requiresRoles?: string[]
		requiresPermissions?: string[]
		hideInMenu?: boolean
		keepAlive?: boolean
		order?: number
	}
}
