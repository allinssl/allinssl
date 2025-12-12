import { ref, computed } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'

/**
 * 标签页配置项接口
 */
export interface UseTabsOptions {
	/** 是否在初始化时自动选中第一个标签 */
	defaultToFirst?: boolean
}

/**
 * 标签页实例接口
 */
export interface TabsInstance {
	/** 当前激活的标签值 */
	activeKey: string
	/** 子路由列表 */
	childRoutes: RouteRecordRaw[]
	/** 切换标签页方法 */
	handleTabChange: (key: string) => void
	/** 标签页渲染组件 */
	TabsComponent: () => JSX.Element
}

/**
 * 标签页钩子函数
 * 用于处理二级路由的标签页导航
 */
export default function useTabs(options: UseTabsOptions = {}): TabsInstance {
	const route = useRoute()
	const router = useRouter()
	const { defaultToFirst = true } = options

	// 当前激活的标签值
	const activeKey = ref(route.name as string)

	// 获取当前路由的子路由配置
	const childRoutes = computed(() => {
		const parentRoute = router.getRoutes().find((r) => r.path === route.matched[0]?.path)
		return parentRoute?.children || []
	})

	/**
	 * 处理标签切换
	 * @param key 目标路由名称
	 */
	const handleTabChange = (key: string) => {
		const targetRoute = childRoutes.value.find((route) => route.name === key)
		if (targetRoute) {
			router.push({ name: key })
			activeKey.value = key
		}
	}

	/**
	 * 标签页组件
	 * 渲染标签页导航和对应的视图
	 */
	const TabsComponent = () => (
		<div class="tabs-container">
			<NTabs value={activeKey.value} onUpdateValue={handleTabChange} type="line" class="tabs-nav">
				{childRoutes.value.map((route: RouteRecordRaw) => (
					<NTabPane key={route.name as string} name={route.name as string} tab={route.meta?.title || route.name} />
				))}
			</NTabs>
			<div class="tabs-content">
				<router-view />
			</div>
		</div>
	)

	// 初始化时自动选中第一个标签
	if (defaultToFirst && childRoutes.value.length > 0 && !route.name) {
		const firstRoute = childRoutes.value[0]
		handleTabChange(firstRoute.name as string)
	}

	return {
		activeKey: activeKey.value,
		childRoutes: childRoutes.value,
		handleTabChange,
		TabsComponent,
	}
}
