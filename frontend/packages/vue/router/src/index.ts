import {
	createRouter,
	createWebHistory,
	createWebHashHistory,
	useRoute,
	useRouter,
	RouterLink,
	RouterView,
	type RouteRecordRedirect,
	type RouteRecordRaw,
	type RouterOptions,
} from 'vue-router'

/**
 * 创建路由
 * @param {RouterOptions} options 路由配置
 * @returns {Router} 路由实例
 */
const useCreateRouter = (
	options: RouterOptions = {
		routes: [],
		history: createWebHistory(),
		scrollBehavior: () => ({ left: 0, top: 0 }),
	},
) => {
	return createRouter({ ...options })
}

export {
	useCreateRouter,
	useRoute,
	useRouter,
	RouterLink,
	RouterView,
	createWebHistory,
	createWebHashHistory,
	type RouteRecordRedirect,
	type RouteRecordRaw,
	type RouterOptions,
}
