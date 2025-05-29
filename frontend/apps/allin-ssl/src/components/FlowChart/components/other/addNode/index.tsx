import { useAddNodeController } from '@components/FlowChart/useController'
import SvgIcon from '@components/SvgIcon'
import styles from './index.module.css'

import type {
	NodeIcon,
	NodeNum,
	NodeTitle,
	BaseNodeData,
	BranchNodeData,
	BaseRenderNodeOptions,
} from '@components/FlowChart/types'
import nodeOptions from '@components/FlowChart/lib/config'

interface NodeSelect {
	title: NodeTitle
	type: NodeNum
	icon: NodeIcon
	selected: boolean
}

export default defineComponent({
	name: 'AddNode',
	props: {
		node: {
			type: Object as PropType<BaseNodeData>,
			default: () => ({}),
		},
	},
	setup(props) {
		const {
			isShowAddNodeSelect,
			nodeSelectList,
			addNodeBtnRef,
			addNodeSelectRef,
			addNodeSelectPostion,
			showNodeSelect,
			addNodeData,
			itemNodeSelected,
			excludeNodeSelectList,
		} = useAddNodeController()

		const config = ref<BaseRenderNodeOptions<BaseNodeData | BranchNodeData>>() // 节点配置

		watch(
			() => props.node.type,
			(newVal) => {
				config.value = nodeOptions[newVal]() || {}
			},
		)

		return () => (
			<div class={styles.add}>
				<div
					ref={addNodeBtnRef}
					class={styles.addBtn}
					onMouseenter={() => showNodeSelect(true, props.node.type as NodeNum)}
					onMouseleave={() => showNodeSelect(false)}
				>
					<SvgIcon icon="plus" class={styles.addBtnIcon} color="#FFFFFF" />
					{isShowAddNodeSelect.value && (
						<ul
							ref={addNodeSelectRef}
							class={[styles.addSelectBox, addNodeSelectPostion.value === 1 ? styles.addLeft : styles.addRight]}
						>
							{nodeSelectList.value.map((item: NodeSelect) => {
								// 判断类型是否支持添加
								if (!excludeNodeSelectList.value?.includes(item.type)) {
									return (
										<li
											key={item.type}
											class={[styles.addSelectItem, item.selected && styles.addSelected]}
											onClick={() => addNodeData(props.node, item.type)}
											onMouseenter={itemNodeSelected}
										>
											<SvgIcon
												icon={'flow-' + item.icon.name}
												class={styles.addSelectItemIcon}
												color={item.selected ? '#FFFFFF' : item.icon.color}
											/>
											<div class={styles.addSelectItemTitle}>{item.title.name}</div>
										</li>
									)
								}
								return null
							})}
						</ul>
					)}
				</div>
			</div>
		)
	},
})
