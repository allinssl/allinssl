import { defineStore, storeToRefs } from 'pinia';
import { ref } from 'vue';

// Type Imports
import type { OverviewData } from '@/types/public';

// Absolute Internal Imports - API
import { getOverviews } from '@/api/public';

// Absolute Internal Imports - Hooks
import { useError } from '@baota/hooks/error';

// Absolute Internal Imports - Utilities
import { $t } from '@locales/index';

/**
 * Home Store 暴露的类型接口
 * @interface HomeStoreExposes
 * @property {Ref<boolean>} loading - 数据加载状态。
 * @property {Ref<OverviewData>} overviewData - 首页概览数据。
 * @property {() => Promise<void>} fetchOverviewData - 获取首页概览数据的方法。
 */
export interface HomeStoreExposes {
	loading: Ref<boolean>;
	overviewData: Ref<OverviewData>;
	fetchOverviewData: () => Promise<void>;
}

/**
 * 首页数据存储 (Pinia Store)
 *
 * @description 使用Pinia管理首页相关的状态和操作，包括：
 * - 概览数据的获取和存储
 * - 加载状态管理
 * @returns {HomeStoreExposes} 包含状态和方法的 Store 实例。
 */
export const useHomeStore = defineStore('home-store', (): HomeStoreExposes => {
	// -------------------- 状态定义 --------------------
	/**
	 * 数据加载状态
	 * @type {Ref<boolean>}
	 * @description 用于控制页面加载指示器的显示。
	 */
	const loading = ref(false);

	/**
	 * 首页概览数据
	 * @type {Ref<OverviewData>}
	 * @description 包含工作流、证书和监控的统计信息以及工作流历史记录。
	 */
	const overviewData = ref<OverviewData>({
		workflow: { count: 0, active: 0, failure: 0 },
		cert: { count: 0, will: 0, end: 0 },
		site_monitor: { count: 0, exception: 0 },
		workflow_history: [],
	});

	// 错误处理
	const { handleError } = useError();

	// -------------------- 请求方法 --------------------
	/**
	 * 获取首页概览数据
	 * @async
	 * @function fetchOverviewData
	 * @returns {Promise<void>} 返回Promise对象，在数据获取完成后解析。
	 */
	const fetchOverviewData = async (): Promise<void> => {
		try {
			loading.value = true
			const { data, status } = await getOverviews().fetch()
			if (status) {
				const { workflow, cert, site_monitor, workflow_history } = data
				overviewData.value = {
					workflow: {
						count: workflow?.count || 0,
						active: workflow?.active || 0,
						failure: workflow?.failure || 0,
					},
					cert: { count: cert?.count || 0, will: cert?.will || 0, end: cert?.end || 0 },
					site_monitor: { count: site_monitor?.count || 0, exception: site_monitor?.exception || 0 },
					workflow_history: workflow_history || [],
				}
			}
		} catch (error) {
			console.error('获取首页概览数据失败', error)
			handleError(error).default($t('t_3_1745833936770'))
		} finally {
			loading.value = false
		}
	}

	// 返回状态和方法
	return {
		loading,
		overviewData,
		fetchOverviewData,
	};
});

/**
 * 首页状态管理钩子 (Composable Function)
 *
 * @description 将 Store 包装为组合式 API 风格，便于在视图组件中使用。
 * 自动处理响应式引用，简化状态的访问和修改。
 *
 * @returns {HomeStoreExposes & ReturnType<typeof storeToRefs<HomeStoreExposes>>} 包含状态和方法的对象，所有状态都已转换为 Ref，支持解构使用。
 */
export const useStore = () => {
	const store = useHomeStore();
	// 结合 storeToRefs 以便从 store 中提取 ref 同时保持响应性
	// 注意：直接扩展 storeToRefs 的返回类型可能比较复杂，
	// 实践中通常直接使用 store 和 storeToRefs 返回的对象。
	// 这里为了更精确的类型提示，可以考虑更复杂的类型体操或接受一定的类型宽松。
	// 一个简化的方式是让调用者自行处理类型，或者返回一个结构更清晰的对象。
	// 为简化，此处返回展开后的 store 和 refs。
	return { ...store, ...storeToRefs(store) };
};
