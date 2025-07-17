import { createDiscreteApi } from 'naive-ui'

import type { Router, RouteLocationNormalized, NavigationGuardNext } from '@baota/router/each'
import { useCreateRouterEach } from '@baota/router/each' // 全局路由守卫

// 创建离散API
const { loadingBar } = createDiscreteApi(['loadingBar'])

/**
 * @description 全局路由守卫
 * @param {Router} router 路由实例
 * @return {void}
 */
const useRouterEach = (router: Router) =>
	useCreateRouterEach(router, {
		beforeEach: (to: RouteLocationNormalized, _: RouteLocationNormalized, next: NavigationGuardNext) => {
			// 开始加载
			loadingBar.start()
			// 判断当前路由是否存在，如果不存在，则跳转到 404
			if (!router.hasRoute(to.name as string)) {
				if (!to.path.includes('/404')) return next({ path: '/404' })
			}
			next()
		},
		afterEach: (to: RouteLocationNormalized) => {
			loadingBar.finish()
		},
	})

export default useRouterEach
