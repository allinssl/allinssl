import { defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import type { Component } from 'vue'

import FlowChart from '@components/FlowChart'
import { useStore } from '@autoDeploy/children/workflowView/useStore'
import { useController } from './useController'
/**
 * @description 工作流视图主组件，负责加载和渲染流程图。
 */
export default defineComponent({
	name: 'WorkflowView',
	setup() {
		const { init } = useController()
		const { workflowType, workDefalutNodeData, isEdit } = useStore()

		// 使用import.meta.glob一次性加载所有节点组件
		const modules = import.meta.glob('./node/*/index.tsx', { eager: true })

		// 创建节点组件映射
		const taskComponents = ref<Record<string, Component>>({})

		// 初始化任务组件映射
		const initTaskComponents = () => {
			const componentsMap: Record<string, Component> = {}
			// 获取文件夹名称（对应节点类型）并映射到组件
			Object.entries(modules).forEach(([path, module]) => {
				// 获取路径中的节点类型
				const match = path.match(/\/node\/([^/]+)\/index\.tsx$/)
				if (match && match[1]) {
					const nodeType = match[1]
					const componentKey = `${nodeType}Node`
					// @ts-ignore
					componentsMap[componentKey] = module.default || module
				}
			})
			taskComponents.value = componentsMap
			console.log('已加载节点组件:', Object.keys(componentsMap))
		}

		// 初始化组件
		onBeforeMount(initTaskComponents)

		// 初始化数据
		onMounted(init)

		return () => (
			<FlowChart
				type={workflowType.value}
				node={workDefalutNodeData.value}
				isEdit={isEdit.value}
				taskComponents={taskComponents.value}
			/>
		)
	},
})
