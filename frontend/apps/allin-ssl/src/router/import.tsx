import { getBuildRoutes } from '@baota/router/import'
import routeConfig from '@config/route'

/**
 * @description 创建路由，动态获取路由配置
 * @returns {RouteRecordRaw[]} 路由配置
 */
export const createRoutes = () => {
	const modules = import.meta.glob('../views/*/index.tsx')
	const childrenModules = import.meta.glob(`../views/*/children/*/index.tsx`)
	return getBuildRoutes(modules, childrenModules, {
		framework: routeConfig.frameworkRoute,
		system: routeConfig.systemRoute,
		sort: routeConfig.sortRoute,
		disabled: routeConfig.disabledRoute,
	})
}
