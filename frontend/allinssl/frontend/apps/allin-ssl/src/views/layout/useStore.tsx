// 外部库依赖
import { defineStore, storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { useLocalStorage, useSessionStorage } from '@vueuse/core'

// 类型导入 - 从全局类型文件导入
import type {
	RouteName,
	LayoutStoreInterface, // 替换 LayoutStoreExposes
	PushSourceTypeItem, // 导入 PushSourceTypeItem
} from '@/types/layout' // 调整路径
import type { DnsProviderOption, NotifyProviderOption } from '@/types/setting'

// 内部模块导入 - Hooks
import { useError } from '@baota/hooks/error'
// 内部模块导入 - API
import { getReportList } from '@api/setting'
import { getAccessAllList } from '@api/index'
// 内部模块导入 - 工具函数
import { $t } from '@locales/index'

/**
 * @description 布局相关的状态管理
 * @warn 包含部分硬编码的业务数据，需要从API获取
 */
export const useLayoutStore = defineStore('layout-store', (): LayoutStoreInterface => {
	// 使用导入的 LayoutStoreInterface
	const { handleError } = useError()

	// ==============================
	// 状态定义
	// ==============================

	/**
	 * @description UI 相关状态
	 */
	const isCollapsed = useLocalStorage<boolean>('layout-collapsed', false)

	/**
	 * @description 消息通知
	 */
	const notifyProvider = ref<NotifyProviderOption[]>([])

	/**
	 * @description DNS提供商
	 */
	const dnsProvider = ref<DnsProviderOption[]>([])

	/**
	 * @description 导航状态
	 */
	const menuActive = useSessionStorage<RouteName>('menu-active', 'home')

	/**
	 * @description 布局内边距
	 */
	const layoutPadding = computed<string>(() => {
		return menuActive.value !== 'home' ? 'var(--n-content-padding)' : '0'
	})

	/**
	 * @description 语言
	 */
	const locales = useLocalStorage<string>('locales-active', 'zhCN')

	/**
	 * @description 推送消息提供商 (保持 PushSourceTypeItem 和 pushSourceType)
	 */
	const pushSourceType = ref<Record<string, PushSourceTypeItem>>({
		mail: { name: $t('t_68_1745289354676') },
		dingtalk: { name: $t('t_32_1746773348993') },
		wecom: { name: $t('t_33_1746773350932') },
		feishu: { name: $t('t_34_1746773350153') },
		webhook: { name: 'WebHook' },
	})

	// ==============================
	// UI 交互方法
	// ==============================

	/**
	 * @description 切换侧边栏折叠状态
	 */
	const toggleCollapse = (): void => {
		isCollapsed.value = !isCollapsed.value
	}

	const handleCollapse = (): void => {
		isCollapsed.value = true
	}

	const handleExpand = (): void => {
		isCollapsed.value = false
	}

	const updateMenuActive = (active: RouteName): void => {
		if (active === 'logout') return
		menuActive.value = active
	}

	const resetDataInfo = (): void => {
		menuActive.value = 'home'
		sessionStorage.removeItem('menu-active')
	}

	// ==============================
	// API 请求方法
	// ==============================

	/**
	 * @description 获取消息通知提供商
	 * @returns 消息通知提供商
	 */
	const fetchNotifyProvider = async (): Promise<void> => {
		try {
			notifyProvider.value = []
			const { data } = await getReportList({ p: 1, search: '', limit: 1000 }).fetch()
			notifyProvider.value =
				data?.map((item) => {
					return {
						label: item.name,
						value: item.id.toString(),
						type: item.type,
					}
				}) || [] // 添加空数组作为备选，以防 data 为 null/undefined
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * @description 获取提供商
	 * @param type - 类型 (简化了联合类型，实际使用时可根据需要定义更精确的类型别名)
	 * @returns 提供商
	 */
	const fetchDnsProvider = async (type: string = ''): Promise<void> => {
		try {
			dnsProvider.value = []
			const { data } = await getAccessAllList({ type }).fetch()
			dnsProvider.value =
				data?.map((item) => ({
					label: item.name,
					value: item.id.toString(),
					type: item.type,
					data: item,
				})) || []
		} catch (error) {
			dnsProvider.value = []
			handleError(error)
		}
	}

	/**
	 * @description 重置DNS提供商
	 *
	 */
	const resetDnsProvider = (): void => {
		dnsProvider.value = []
	}

	return {
		isCollapsed,
		notifyProvider,
		dnsProvider,
		menuActive,
		layoutPadding,
		locales,
		pushSourceType,
		toggleCollapse,
		handleCollapse,
		handleExpand,
		updateMenuActive,
		resetDataInfo,
		fetchNotifyProvider,
		fetchDnsProvider,
		resetDnsProvider,
	}
})

export const useStore = () => {
	const store = useLayoutStore()
	return { ...store, ...storeToRefs(store) }
}
