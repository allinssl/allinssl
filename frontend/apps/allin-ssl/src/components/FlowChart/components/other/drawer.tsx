import { NEmpty } from 'naive-ui'
import type { BaseNodeData } from '@components/FlowChart/types'
import { $t } from '@locales/index'

type AsyncComponentLoader = () => Promise<Component>

/**
 * 节点配置抽屉组件
 * 用于显示节点配置界面，根据节点类型动态加载对应的配置组件
 */
export default defineComponent({
	name: 'FlowChartDrawer',
	props: {
		/**
		 * 节点数据
		 */
		node: {
			type: Object as PropType<BaseNodeData | null>,
			default: null,
		},
	},
	setup(props) {
		/**
		 * 节点配置组件Map
		 */
		const nodeConfigComponents = shallowRef<Record<string, any>>({})

		/**
		 * 动态导入节点配置组件
		 * 使用import.meta.glob导入所有drawer组件
		 * 1. 任务节点配置组件
		 * 2. 基础节点配置组件
		 */
		const taskDrawers: Record<string, AsyncComponentLoader> = import.meta.glob('../task/*/drawer.tsx') as Record<
			string,
			AsyncComponentLoader
		>

		// 预加载所有抽屉组件
		const loadComponents = () => {
			// 加载任务节点组件
			Object.keys(taskDrawers).forEach((path) => {
				const matches = path.match(/\.\.\/task\/(\w+)\/drawer\.tsx/)
				if (matches && matches[1]) {
					const nodeType = matches[1].replace('Node', '').toLowerCase()
					const loaderFn = taskDrawers[path]
					if (loaderFn) {
						nodeConfigComponents.value[nodeType] = defineAsyncComponent(loaderFn)
					}
				}
			})
		}

		/**
		 * 渲染节点配置组件
		 */
		const renderConfigComponent = computed(() => {
			if (!props.node || !props.node.type) {
				return h(NEmpty, {
					description: $t('t_2_1744870863419'),
				})
			}
			const nodeType = props.node.type
			// 查找对应类型的配置组件
			if (nodeConfigComponents.value[nodeType]) {
				return h(nodeConfigComponents.value[nodeType], { node: props.node })
			}
			// 找不到对应的配置组件时显示提示
			return h(NEmpty, {
				description: $t('t_3_1744870864615'),
			})
		})

		loadComponents()

		return () => (
			<div class=" h-full w-full bg-white transform transition-transform duration-300 flex flex-col p-[1.5rem]">
				{renderConfigComponent.value}
			</div>
		)
	},
})
