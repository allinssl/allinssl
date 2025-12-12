import { onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useStore } from '@autoDeploy/children/workflowView/useStore'
import { $t } from '@locales/index'

/**
 * @description WorkflowView 的控制器，处理路由、页面生命周期事件和初始化逻辑。
 * @returns 返回包含初始化方法的对象。
 */
export const useController = () => {
	const { workflowType, detectionRefresh } = useStore()
	const route = useRoute()
	const router = useRouter()

	// 监听页面刷新
	const beforeUnload = (event: BeforeUnloadEvent) => {
		event.preventDefault()
		event.returnValue = $t('t_16_1747886308182')
		return $t('t_16_1747886308182')
	}

	// 初始化
	const init = () => {
		// 监听页面刷新
		window.addEventListener('beforeunload', beforeUnload)
		// 获取路由参数
		const type = route.query.type
		if (type) workflowType.value = type as 'quick' | 'advanced'
		// 如果检测刷新为false，则跳转至自动部署页面
		if (!detectionRefresh.value && route.path !== '/auto-deploy') router.push('/auto-deploy')
	}

	// 卸载
	onUnmounted(() => {
		window.removeEventListener('beforeunload', beforeUnload)
	})

	return {
		init,
	}
}
