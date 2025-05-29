import { NButton, NIcon, NInput } from 'naive-ui'
import { SaveOutlined, ArrowLeftOutlined } from '@vicons/antd'
import { $t } from '@locales/index'
import SvgIcon from '@components/SvgIcon'

import { useController } from './useController'
import { useStore } from './useStore'

import EndNode from './components/base/endNode'
import NodeWrap from './components/render/nodeWrap'

import styles from './index.module.css'
import type { FlowNode, FlowNodeProps } from './types'
import { useThemeCssVar } from '@baota/naive-ui/theme'

export default defineComponent({
	name: 'FlowChart',
	props: {
		isEdit: {
			type: Boolean,
			default: false,
		},
		type: {
			type: String as PropType<'quick' | 'advanced'>,
			default: 'quick',
		},
		node: {
			type: Object as PropType<FlowNode>,
			default: () => ({}),
		},
		// 任务节点列表
		taskComponents: {
			type: Object as PropType<Record<string, Component>>,
			default: () => ({}),
		},
	},
	setup(props: FlowNodeProps, { slots }) {
		const cssVars = useThemeCssVar([
			'borderColor',
			'dividerColor',
			'textColor1',
			'textColor2',
			'primaryColor',
			'primaryColorHover',
			'bodyColor',
		])
		const { flowData, selectedNodeId, flowZoom, resetFlowData } = useStore()
		const { initData, handleSaveConfig, handleZoom, goBack } = useController({
			type: props?.type,
			node: props?.node,
			isEdit: props?.isEdit,
		})
		// 提供任务节点组件映射给后代组件使用
		provide('taskComponents', props.taskComponents)
		onMounted(initData)
		onUnmounted(resetFlowData)
		return () => (
			<div class="flex flex-col w-full h-full" style={cssVars.value}>
				<div class="w-full h-[6rem] px-[2rem] mb-[2rem] rounded-lg flex items-center gap-2 justify-between">
					<div class="flex items-center">
						<NButton onClick={goBack}>
							<NIcon class="mr-1">
								<ArrowLeftOutlined />
							</NIcon>
							{$t('t_0_1744861190562')}
						</NButton>
					</div>
					<div class="flex items-center ml-[.5rem]">
						<NInput
							v-model:value={flowData.value.name}
							placeholder={$t('t_0_1745490735213')}
							class="!w-[30rem] !border-none "
						/>
					</div>
					<div class="flex items-center gap-2">
						<NButton type="primary" onClick={handleSaveConfig} disabled={!selectedNodeId}>
							<NIcon class="mr-1">
								<SaveOutlined />
							</NIcon>
							{$t('t_2_1744861190040')}
						</NButton>
					</div>
				</div>
				<div class="w-full flex">
					{/* 左侧流程容器 */}
					<div class={styles.flowContainer}>
						{/* 流程容器*/}
						<div class={styles.flowProcess} style={{ transform: `scale(${flowZoom.value / 100})` }}>
							{/* 渲染流程节点 */}
							<NodeWrap node={flowData.value.childNode} />
							{/* 流程结束节点  */}
							<EndNode />
						</div>
						{/*  缩放控制区 */}
						<div class={styles.flowZoom}>
							<div class={styles.flowZoomIcon} onClick={() => handleZoom(1)}>
								<SvgIcon icon="subtract" class={`${flowZoom.value === 50 ? styles.disabled : ''}`} color="#5a5e66" />
							</div>
							<span>{flowZoom.value}%</span>
							<div class={styles.flowZoomIcon} onClick={() => handleZoom(2)}>
								<SvgIcon icon="plus" class={`${flowZoom.value === 300 ? styles.disabled : ''}`} color="#5a5e66" />
							</div>
						</div>
					</div>
				</div>
				{/* 保留原有插槽 */}
				{slots.default?.()}
			</div>
		)
	},
})
