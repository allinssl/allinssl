import { useModal } from '@baota/naive-ui/hooks'
import { $t } from '@locales/index'
import { Ref } from 'vue'
import { JSX } from 'vue/jsx-runtime'

/**
 * @description 节点点击处理器
 * @template T 节点配置类型
 */
export function useNodeHandler<T = Record<string, any>>() {
	/**
	 * @description 处理节点点击事件
	 * @param {Ref<{ id: string; name: string; config: T }>} selectedNode 选中的节点
	 * @param {string} title 标题后缀（可选）
	 * @param {string} area 弹窗宽度（默认：'60rem'）
	 * @param {() => JSX.Element} drawerComponent 抽屉组件渲染函数
	 * @param {boolean} showFooter 是否显示底部（默认：true）
	 */
	const handleNodeClick = (
		selectedNode: Ref<{ id: string; name: string; config: T }>,
		drawerComponent: (node: any) => JSX.Element,
		title?: string | false,
		area: string | string[] = '60rem',
		showFooter: boolean = true,
	) => {
		useModal({
			title: `${selectedNode.value?.name}${title || $t('t_1_1745490731990')}`,
			area,
			component: () => drawerComponent(selectedNode.value),
			confirmText: $t('t_2_1744861190040'),
			footer: showFooter,
		})
	}

	return {
		handleNodeClick,
	}
}
