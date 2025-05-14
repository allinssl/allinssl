import { useError } from '@baota/hooks/error'

import type { RouteName } from './types'
import { DnsProviderOption, NotifyProviderOption } from '@/types/setting'
import { getReportList } from '@api/setting'
import { getAccessAllList } from '@api/index'
import { $t } from '@locales/index'

/**
 * @description 布局相关的状态管理
 * @warn 包含部分硬编码的业务数据，需要从API获取
 */
export const useLayoutStore = defineStore('layout-store', () => {
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
	const layoutPadding = computed(() => {
		return menuActive.value !== 'home' ? 'var(--n-content-padding)' : '0'
	})

	/**
	 * @description 语言
	 */
	const locales = useLocalStorage<string>('locales-active', 'zhCN')

	/**
	 * @description 主机提供商
	 */
	const sourceTypes = ref({
		// 主机提供商
		ssh: { name: 'SSH', access: ['host'] },
		btpanel: { name: $t('t_10_1745735765165'), access: ['host'] },
		'1panel': { name: '1Panel', access: ['host'] },
		aliyun: { name: $t('t_2_1747019616224'), access: ['dns', 'host'] },
		tencentcloud: { name: $t('t_3_1747019616129'), access: ['dns', 'host'] },
		huaweicloud: { name: '华为云', access: ['dns'] },
		cloudflare: { name: 'Cloudflare', access: ['dns'] },
	})

	/**
	 * @description 主机提供商衍生类型
	 */
	const sourceDerivationTypes = ref({
		// 网站
		'btpanel-site': { name: $t('t_11_1745735766456') },
		'1panel-site': { name: $t('t_13_1745735766084') },
		// 云服务
		'aliyun-cdn': { name: $t('t_16_1745735766712') },
		'aliyun-oss': { name: $t('t_2_1746697487164') },
		'tencentcloud-cdn': { name: $t('t_14_1745735766121') },
		'tencentcloud-cos': { name: $t('t_15_1745735768976') },
	})

	/**
	 * @description 消息通知提供商
	 */
	const pushSourceType = ref({
		mail: { name: $t('t_68_1745289354676') },
		dingtalk: { name: $t('t_32_1746773348993') },
		wecom: { name: $t('t_33_1746773350932') },
		feishu: { name: $t('t_34_1746773350153') },
		webhook: { name: 'WebHook' },
	})

	// ==============================
	// UI 交互方法
	// ==============================
	// UI 交互方法
	// ==============================

	/**
	 * @description 切换侧边栏折叠状态
	 */
	const toggleCollapse = (): void => {
		isCollapsed.value = !isCollapsed.value
	}

	/**
	 * @description 展开侧边栏
	 */
	const handleCollapse = () => {
		isCollapsed.value = true
	}

	/**
	 * @description 收起侧边栏
	 */

	const handleExpand = () => {
		isCollapsed.value = false
	}

	/**
	 * @description 更新菜单激活状态
	 * @param active - 激活状态
	 */
	const updateMenuActive = (active: RouteName): void => {
		if (active === 'logout') return
		menuActive.value = active
	}

	/**
	 * @description 重置数据信息
	 */
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
			notifyProvider.value = data?.map((item) => {
				return {
					label: item.name,
					value: item.id.toString(),
					type: item.type,
				}
			})
		} catch (error) {
			handleError(error)
		}
	}

	/**
	 * @description 获取DNS提供商
	 * @param type - 类型
	 * @returns DNS提供商
	 */
	const fetchDnsProvider = async (
		type: 'btpanel' | 'aliyun' | 'ssh' | 'tencentcloud' | '1panel' | 'dns' | '' = '',
	): Promise<void> => {
		try {
			dnsProvider.value = []
			const { data } = await getAccessAllList({ type }).fetch()
			dnsProvider.value =
				data?.map((item) => ({
					label: item.name,
					value: item.id.toString(),
					type: item.type,
				})) || []
		} catch (error) {
			handleError(error)
		}
	}

	// ==============================
	// 表单处理方法
	// ==============================

	return {
		// 状态
		locales,
		notifyProvider,
		dnsProvider,
		isCollapsed,
		layoutPadding,
		menuActive,
		sourceTypes,
		sourceDerivationTypes,
		pushSourceType,

		// 方法
		resetDataInfo,
		updateMenuActive,
		toggleCollapse,
		handleCollapse,
		handleExpand,
		fetchNotifyProvider,
		fetchDnsProvider,
	}
})

/**
 * @description 辅助函数：获取布局相关的状态和方法
 * @returns 组合了store实例和响应式引用的对象
 */
export const useStore = () => {
	const store = useLayoutStore()
	return { ...store, ...storeToRefs(store) }
}
