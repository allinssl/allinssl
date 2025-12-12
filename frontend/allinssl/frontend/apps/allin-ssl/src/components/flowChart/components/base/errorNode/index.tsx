import { BaseNodeData } from '@components/FlowChart/types'

export default defineComponent({
	name: 'BranchNode',
	props: {
		node: {
			type: Object as () => BaseNodeData,
			default: () => ({}),
		},
	},
	setup() {
		return () => <div>渲染节点失败，请检查类型是否支持</div>
	},
})
