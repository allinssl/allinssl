import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

const registerPluginNode = vi.hoisted(() => vi.fn())
const hidePluginNode = vi.hoisted(() => vi.fn())
const replacePluginForm = vi.hoisted(() => vi.fn())
vi.mock('@components/FlowChart/lib/config', () => ({ registerPluginNode, hidePluginNode, replacePluginForm }))

import { createWorkflowApi } from './workflow'

beforeEach(() => {
  registerPluginNode.mockReset()
  hidePluginNode.mockReset()
  replacePluginForm.mockReset()
})

describe('插件工作流前端注册', () => {
  it('新增节点生成宿主类型并校验必填界面字段', () => {
    const api = createWorkflowApi('plus')
    expect(() => api.addNode({ name: 'pause', title: '暂停' } as any)).toThrow('summary')
    api.addNode({ name: 'pause', title: '暂停执行', summary: () => '等待', order: 6 })
    expect(registerPluginNode).toHaveBeenCalledWith('plugin:plus:pause', expect.objectContaining({ name: 'pause', order: 6 }))
  })

  it('内置节点保留原类型，插件本地名称转换为完整类型', () => {
    const api = createWorkflowApi('plus')
    const form = defineComponent({ render: () => null })
    api.hideNode('notify')
    api.hideNode('pause')
    api.replaceForm('apply', form)
    api.replaceForm('pause', form)
    expect(hidePluginNode.mock.calls.map(call => call[0])).toEqual(['notify', 'plugin:plus:pause'])
    expect(replacePluginForm.mock.calls.map(call => call[0])).toEqual(['apply', 'plugin:plus:pause'])
  })
})
