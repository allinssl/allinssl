import { computed, defineComponent, h, type PropType, type Ref } from 'vue'
import { useModal } from '@baota/naive-ui/hooks'
import { getPluginWorkflowForm, getPluginWorkflowNode } from '@components/FlowChart/lib/config'
import { useStore } from '@components/FlowChart/useStore'
import type { BaseNodeData } from '@components/FlowChart/types'

// 插件节点只渲染注册的摘要，编辑界面由插件入口按需提供。
export default defineComponent({
  name: 'PluginWorkflowNode',
  props: {
    node: { type: Object as PropType<BaseNodeData>, required: true },
  },
  setup(props, { expose }) {
    const { updateNodeConfig } = useStore()
    const meta = computed(() => getPluginWorkflowNode(props.node.type))

    const handleNodeClick = (selectedNode: Ref<BaseNodeData>) => {
      const node = selectedNode.value || props.node
      const form = getPluginWorkflowForm(node.type) || meta.value?.form
      if (!form) return
      let modal: { close: () => void }
      modal = useModal({
        title: node.name,
        area: '60rem',
        footer: false,
        component: () =>
          h(form, {
            node,
            save: (config: Record<string, any>) => {
              updateNodeConfig(node.id || '', config)
              modal.close()
            },
            close: () => modal.close(),
          }),
      })
    }

    expose({ handleNodeClick })

    return () => {
      const message = meta.value?.validate?.(props.node.config || {}) || ''
      return h(
        'span',
        { class: message ? 'text-[var(--n-error-color)]' : '' },
        message || meta.value?.summary?.(props.node.config || {}) || meta.value?.title || '',
      )
    }
  },
})
