import type { NavigationFailure, NavigationGuardNext, RouteLocationNormalized, Router } from 'vue-router'

/**
 * @description 路由守卫
 * @param {Router} router	路由实例
 * @return {void}
 */
const useCreateRouterEach = (
	router: Router,
	{
		beforeEach,
		afterEach,
	}: {
		beforeEach?: (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => void
		afterEach?: (to: RouteLocationNormalized, from: RouteLocationNormalized, failure?: NavigationFailure | void) => void
	} = {},
) => {
	// 全局路由守卫 - 前置
	router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
		if (beforeEach) beforeEach(to, from, next)
	})
	// 全局路由守卫 - 后置
	router.afterEach((to: RouteLocationNormalized, from: RouteLocationNormalized, failure?: void | NavigationFailure) => {
		if (afterEach) afterEach(to, from, failure)
	})
}

export {
	useCreateRouterEach,
	type Router,
	type RouteLocationNormalized,
	type NavigationGuardNext,
	type NavigationFailure,
}
