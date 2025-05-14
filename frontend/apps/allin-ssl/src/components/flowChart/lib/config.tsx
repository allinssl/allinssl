import { deepMerge } from '@baota/utils/data'
import { v4 as uuidv4 } from 'uuid'
import {
	APPLY,
	BRANCH,
	CONDITION,
	DEPLOY,
	NOTIFY,
	UPLOAD,
	EXECUTE_RESULT_BRANCH,
	EXECUTE_RESULT_CONDITION,
	START,
} from './alias'
import {
	BaseRenderNodeOptions,
	NodeOptions,
	BaseNodeData,
	ExecuteResultConditionNodeData,
	ExecuteResultBranchNodeData,
} from '../types'

const nodeOptions = {} as NodeOptions

// 基础节点配置
const baseOptions = <T extends BaseNodeData>(
	options: Partial<BaseRenderNodeOptions<T>> & { defaultNode?: T },
): BaseRenderNodeOptions<T> => {
	const defaultOptions: BaseRenderNodeOptions<T> = {
		title: {
			name: '', // 节点标题
			color: '#FFFFFF', // 节点标题颜色
			bgColor: '#3CB371', // 节点标题背景颜色
		},
		icon: {
			name: '', // 节点图标
			color: '#3CB371', // 节点图标颜色
		},
		operateNode: {
			add: true, // 节点是否可以追加
			sort: 1, // 节点排序，用于排序节点的显示优先级，主要用于配置节点的操作
			addBranch: false, // 节点是否可以添加分支
			edit: true, // 节点是否可以编辑
			remove: true, // 节点是否可以删除
			onSupportNode: [], // 节点不支持添加的节点类型
		},
		isHasDrawer: false, // 节点是否可以进行配置
		defaultNode: {} as T,
	}
	return deepMerge(defaultOptions, options) as BaseRenderNodeOptions<T>
}

// ------------------------------ 基础节点配置 ------------------------------

// // 结束节点
// nodeOptions[END] = baseOptions({
// 	title: { name: '结束' },
// 	icon: { name: END },
// 	addNode: false,
// 	removedNode: false,
// 	hasDrawer: false,
// 	hiddenNode: true,
// })

// // 默认节点
// nodeOptions[DEFAULT] = baseOptions({
// 	title: { name: '默认' },
// 	icon: { name: DEFAULT },
// 	addNode: true,
// 	hasDrawer: true,
// 	defaultNode: {
// 		name: '默认',
// 		type: DEFAULT,
// 		config: {},
// 		childNode: null,
// 	},
// })

// ------------------------------ 执行业务节点配置 ------------------------------

// 开始节点
nodeOptions[START] = () =>
	baseOptions({
		title: { name: '开始' },
		operateNode: { onSupportNode: [EXECUTE_RESULT_BRANCH], remove: false, edit: false, add: false },
		defaultNode: {
			id: uuidv4(),
			name: '开始',
			type: START,
			config: {
				exec_type: 'manual',
			},
			childNode: null,
		},
	})

// 申请节点
nodeOptions[APPLY] = () =>
	baseOptions({
		title: { name: '申请' },
		icon: { name: APPLY },
		operateNode: { sort: 1 },
		defaultNode: {
			id: uuidv4(),
			name: '申请',
			type: APPLY,
			config: {
				domains: '',
				email: '',
				end_day: 30,
				provider: '',
				provider_id: '',
			},
			childNode: null,
		},
	})

// 上传节点
nodeOptions[UPLOAD] = () =>
	baseOptions({
		title: { name: '上传' },
		icon: { name: UPLOAD },
		operateNode: { sort: 2, onSupportNode: [EXECUTE_RESULT_BRANCH] },
		defaultNode: {
			id: uuidv4(),
			name: '上传',
			type: UPLOAD,
			config: {
				cert_id: '',
				cert: '',
				key: '',
			},
			childNode: null,
		},
	})

// 部署节点
nodeOptions[DEPLOY] = () =>
	baseOptions({
		title: { name: '部署' },
		icon: { name: DEPLOY },
		operateNode: { sort: 3 },
		defaultNode: {
			id: uuidv4(),
			name: '部署',
			type: DEPLOY,
			inputs: [],
			config: {
				provider: '',
				provider_id: '',
				inputs: {
					fromNodeId: '',
					name: '',
				},
			},
			childNode: null,
		},
	})

// 通知节点
nodeOptions[NOTIFY] = () =>
	baseOptions({
		title: { name: '通知' },
		icon: { name: NOTIFY },
		operateNode: { sort: 4 },
		defaultNode: {
			id: uuidv4(),
			name: '通知',
			type: NOTIFY,
			config: {
				provider: '',
				provider_id: '',
				subject: '',
				body: '',
			},
			childNode: null,
		},
	})

// 分支节点
nodeOptions[BRANCH] = () =>
	baseOptions({
		title: { name: '并行分支' },
		icon: { name: BRANCH },
		operateNode: { sort: 5, addBranch: true },
		defaultNode: {
			id: uuidv4(),
			name: '并行分支',
			type: BRANCH,
			conditionNodes: [
				{
					id: uuidv4(),
					name: '分支1',
					type: CONDITION,
					config: {},
					childNode: null,
				},
				{
					id: uuidv4(),
					name: '分支2',
					type: CONDITION,
					config: {},
					childNode: null,
				},
			],
		},
	})

// 条件节点
nodeOptions[CONDITION] = () =>
	baseOptions({
		title: { name: '分支1' },
		icon: { name: CONDITION },
		operateNode: { add: false, onSupportNode: [EXECUTE_RESULT_BRANCH] },
		defaultNode: {
			id: uuidv4(),
			name: '分支1',
			type: CONDITION,
			icon: { name: CONDITION },
			config: {},
			childNode: null,
		},
	})

// 执行结构分支
nodeOptions[EXECUTE_RESULT_BRANCH] = () =>
	baseOptions<ExecuteResultBranchNodeData>({
		title: { name: '执行结果分支' },
		icon: { name: BRANCH },
		operateNode: { sort: 7, onSupportNode: [EXECUTE_RESULT_BRANCH] },
		defaultNode: {
			id: uuidv4(),
			name: '执行结果分支',
			type: EXECUTE_RESULT_BRANCH,
			conditionNodes: [
				{
					id: uuidv4(),
					name: '若当前节点执行成功…',
					type: EXECUTE_RESULT_CONDITION,
					icon: { name: 'success' },
					config: { type: 'success' },
					childNode: null,
				},
				{
					id: uuidv4(),
					name: '若当前节点执行失败…',
					type: EXECUTE_RESULT_CONDITION,
					icon: { name: 'error' },
					config: { type: 'fail' },
					childNode: null,
				},
			],
		},
	})

// 执行结构条件
nodeOptions[EXECUTE_RESULT_CONDITION] = () =>
	baseOptions<ExecuteResultConditionNodeData>({
		title: { name: '执行结构条件' },
		icon: { name: BRANCH },
		operateNode: { add: false, onSupportNode: [EXECUTE_RESULT_BRANCH] },
		defaultNode: {
			id: uuidv4(),
			name: '若前序节点执行失败…',
			type: EXECUTE_RESULT_CONDITION,
			icon: { name: 'SUCCESS' },
			config: { type: 'SUCCESS' },
			childNode: null,
		},
	})

export default nodeOptions
