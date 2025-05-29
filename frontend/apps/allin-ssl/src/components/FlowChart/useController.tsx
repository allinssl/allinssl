import { v4 as uuidv4 } from 'uuid'
import { useMessage } from '@baota/naive-ui/hooks'
import { $t } from '@locales/index'
import { useStore } from '@components/FlowChart/useStore'
import { useStore as useWorkflowViewStore } from '@autoDeploy/children/workflowView/useStore'
import { useNodeValidator } from '@components/FlowChart/lib/verify'
import { useError } from '@baota/hooks/error'

import type { BaseNodeData, BranchNodeData, FlowNodeProps, NodeNum, StartNodeConfig } from '@components/FlowChart/types'

const message = useMessage()
const {
	flowData,
	selectedNodeId,
	setflowZoom,
	initFlowData,
	updateFlowData,
	setShowAddNodeSelect,
	addNode,
	getAddNodeSelect,
	resetFlowData,
} = useStore()

const { workflowData, addNewWorkflow, updateWorkflowData, resetWorkflowData } = useWorkflowViewStore()
const { handleError } = useError()

/**
 * 流程图控制器
 * 用于处理流程图的业务逻辑和用户交互
 * @param {FlowNodeProps} props - 节点数据，可选
 */
export const useController = (props: FlowNodeProps = { type: 'quick', node: flowData.value, isEdit: false }) => {
	// 使用store获取所有需要的方法和状态
	const router = useRouter()
	const route = useRoute()

	/**
	 * 保存节点配置
	 * 将当前选中节点的配置保存到流程图中
	 */
	const handleSaveConfig = () => {
		const { validator } = useNodeValidator()
		const res = validator.validateAll()
		try {
			if (res.valid && flowData.value.name) {
				const { active } = workflowData.value
				const { id, name, childNode } = flowData.value
				const { exec_type, ...exec_time } = childNode.config as unknown as StartNodeConfig
				const param = {
					name,
					active,
					content: JSON.stringify(childNode),
					exec_type,
					exec_time: JSON.stringify(exec_time || {}),
				}
				if (route.query.isEdit) {
					updateWorkflowData({ id, ...param })
				} else {
					addNewWorkflow(param)
				}
				router.push('/auto-deploy')
			} else if (!flowData.value.name) {
				message.error('保存失败，请输入工作流名称')
			}
			for (const key in res.results) {
				if (res.results.hasOwnProperty(key)) {
					const result = res.results[key] as { valid: boolean; message: string }
					if (!result.valid) {
						message.error(result.message)
						break
					}
				}
			}
		} catch (error) {
			handleError(error).default($t('t_12_1745457489076'))
		}
	}

	/**
	 * 运行流程图
	 * 触发流程图的执行
	 */
	const handleRun = () => {
		message.info($t('t_8_1744861189821'))
		// 这里可以添加实际的运行逻辑
	}

	/**
	 * 流程图缩放控制
	 * @param {number} type - 缩放类型 1:缩小，2:放大
	 */
	const handleZoom = (type: number) => {
		setflowZoom(type)
	}

	/**
	 * 返回上一级
	 */
	const goBack = () => {
		router.back()
	}

	/**
	 * 初始化流程图数据
	 */
	const initData = () => {
		console.log(props.node, 'init')
		resetFlowData()
		resetWorkflowData()
		// 如果传入了节点数据，使用传入的数据
		if (props.isEdit && props.node) {
			console.log(props.node, 'edit')
			updateFlowData(props.node)
		} else if (props.type === 'quick') {
			initFlowData() // 否则使用默认数据初始化
		} else if (props.type === 'advanced') {
			updateFlowData(props.node)
		}
	}

	// 如果传入了node，则当node变化时更新store中的flowData
	if (props.node) {
		watch(
			() => props.node,
			(newVal) => {
				updateFlowData(newVal)
			},
			{ deep: true },
		)
	}

	return {
		flowData,
		selectedNodeId,
		handleSaveConfig,
		handleZoom,
		handleRun,
		goBack,
		initData,
	}
}

/**
 * 添加节点控制器
 * 用于处理添加节点的业务逻辑
 */
export function useAddNodeController() {
	// 使用store获取所有需要的方法和状态
	const store = useStore()

	/**
	 * 是否显示添加节点选择框
	 * @type {Ref<boolean>}
	 */
	const isShowAddNodeSelect = ref(false)

	/**
	 * 定时器
	 * @type {Ref<number | null>}
	 */
	const timer = ref<number | null>(null)

	/**
	 * 显示节点选择
	 * @param {boolean} flag - 是否显示
	 * @param {NodeNum} [nodeType] - 节点类型
	 */
	const showNodeSelect = (flag: boolean, nodeType?: NodeNum) => {
		if (!flag) {
			clearTimeout(timer.value as number)
			timer.value = window.setTimeout(() => {
				isShowAddNodeSelect.value = flag
			}, 200) as unknown as number
		} else {
			isShowAddNodeSelect.value = false
			isShowAddNodeSelect.value = flag
		}
		// 设置添加节点选择状态
		if (nodeType) {
			setShowAddNodeSelect(flag, nodeType)
		}
	}

	/**
	 * 添加节点数据
	 * @param {BaseNodeData} parentNode - 父节点
	 * @param {NodeNum} type - 生成节点类型
	 */
	const addNodeData = (parentNode: BaseNodeData, type: NodeNum) => {
		console.log(parentNode, type)
		// 设置添加节点选择状态
		isShowAddNodeSelect.value = false
		// 判断是否存储节点配置数据
		if (parentNode.id) addNode(parentNode.id, type, { id: uuidv4() })
	}

	/**
	 * 添加节点选中状态
	 */
	const itemNodeSelected = () => {
		clearTimeout(timer.value as number)
	}

	// 获取添加节点选择
	getAddNodeSelect()

	return {
		...store,
		addNodeData,
		itemNodeSelected,
		isShowAddNodeSelect,
		showNodeSelect,
	}
}
