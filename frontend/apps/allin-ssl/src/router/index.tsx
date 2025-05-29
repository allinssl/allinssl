import { createWebHistory, useCreateRouter } from '@baota/router' // 框架路由
import { createRoutes } from './import' // 自动导入路由配置
import useRouterEach from './each' // 全局路由守卫

// 获取路由
const { routeGroup, routes } = createRoutes() // 获取路由配置

// 创建路由
const router = useCreateRouter({
	routes: routeGroup,
	history: createWebHistory(),
})

// 全局路由守卫
useRouterEach(router)

export { router, routes }
