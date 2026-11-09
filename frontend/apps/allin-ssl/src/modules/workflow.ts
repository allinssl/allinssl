import type { Component } from 'vue'
import { hidePluginNode, registerPluginNode, replacePluginForm } from '@components/FlowChart/lib/config'
import type { ModuleWorkflowApi, PluginWorkflowNode } from './types'

// 节点名可以写本地名称，也可以写完整类型；统一转成宿主类型。
function resolveType(id: string, name: string) {
  if (name.startsWith('plugin:')) return name
  if (['apply', 'deploy', 'upload', 'notify', 'private_ca', 'start', 'branch', 'condition', 'execute_result_branch', 'execute_result_condition'].includes(name)) return name
  return `plugin:${id}:${name}`
}

export function createWorkflowApi(id: string): ModuleWorkflowApi {
  return {
    addNode(node: PluginWorkflowNode) {
      if (!node?.name || !node?.title || typeof node.summary !== 'function') {
        throw new Error('插件工作流节点缺少 name、title 或 summary')
      }
      registerPluginNode(resolveType(id, node.name), node)
    },
    hideNode(name: string) {
      hidePluginNode(resolveType(id, name))
    },
    replaceForm(name: string, form: Component) {
      replacePluginForm(resolveType(id, name), form)
    },
  }
}
