import { useNodeValidator } from '@components/FlowChart/lib/verify'
import { useStore } from '@components/FlowChart/useStore'
import { useThemeCssVar } from '@baota/naive-ui/theme'
import { PropType, computed, onUnmounted, watch } from 'vue'

export interface BaseNodeProps<T = Record<string, any>> {
	node: {
		id: string
		config: T
	}
}

export function useBaseNodeValidator<T extends Record<string, any>>(
	props: BaseNodeProps<T>,
	rules: any,
	renderContent: (valid: boolean, config: T) => any,
) {
	// 注册验证器
	const { isRefreshNode } = useStore()
	// 初始化节点状态
	const { registerCompatValidator, validate, validationResult, unregisterValidator } = useNodeValidator()
	// 主题色
	const cssVar = useThemeCssVar(['warningColor', 'primaryColor'])

	// 是否有效
	const validColor = computed((): string => {
		return validationResult.value.valid ? 'var(--n-primary-color)' : 'var(--n-warning-color)'
	})

	// 监听是否刷新节点
	watch(
		() => isRefreshNode.value,
		(newVal) => {
			useTimeoutFn(() => {
				registerCompatValidator(props.node.id, rules, props.node.config)
				validate(props.node.id)
				isRefreshNode.value = null
			}, 500)
		},
		{ immediate: true },
	)

	onUnmounted(() => unregisterValidator(props.node.id))

	// 渲染节点状态
	const renderNode = () => (
		<div style={cssVar.value} class="text-[12px]">
			<div style={{ color: validColor.value }}>{renderContent(validationResult.value.valid, props.node.config)}</div>
		</div>
	)

	return {
		validationResult,
		validColor,
		renderNode,
	}
}

// 通用节点组件
export default defineComponent({
	name: 'BaseNode',
	props: {
		node: {
			type: Object as PropType<{ id: string; config: Record<string, any> }>,
			default: () => ({ id: '', config: {} }),
		},
		rules: {
			type: Object,
			required: true,
		},
		renderContent: {
			type: Function as PropType<(valid: boolean, config: Record<string, any>) => any>,
			required: true,
		},
	},
	setup(props) {
		const { renderNode } = useBaseNodeValidator(
			props as BaseNodeProps<Record<string, any>>,
			props.rules,
			props.renderContent,
		)

		return renderNode
	},
})
