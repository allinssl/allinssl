import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, unref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useNodeValidator } from '@components/FlowChart/lib/verify'
import UploadNode from './index'

vi.mock('./model', () => ({ default: {} }))
vi.mock('@locales/index', () => ({ $t: (key: string) => key === 't_8_1745735765753' ? '已配置' : '未配置' }))
vi.mock('@workflowView/lib/NodeHandler', () => ({ useNodeHandler: () => ({ handleNodeClick: vi.fn() }) }))
vi.mock('@workflowView/lib/BaseNodeValidator', () => ({
	useBaseNodeValidator: (props: any, rules: any, renderContent: any) => {
		const { registerCompatValidator, validate } = useNodeValidator()
		registerCompatValidator(props.node.id, unref(rules), props.node.config)
		const result = validate(props.node.id)
		return { renderNode: () => renderContent(result.valid, props.node.config) }
	},
}))

describe('上传节点配置状态', () => {
	it.each([
		['空配置', {}, '未配置'],
		['默认配置', { cert_id: '', domains: '', use_local_cert: false, end_day: 30 }, '未配置'],
		['仅有正文', { cert: '证书正文' }, '未配置'],
		['仅有私钥', { key: '证书私钥' }, '未配置'],
		['旧版正文和私钥', { cert: '证书正文', key: '证书私钥' }, '已配置'],
		['证书引用', { cert_id: '证书引用' }, '已配置'],
		['开启本地匹配但缺少域名', { cert_id: '证书引用', use_local_cert: true, end_day: 30 }, '未配置'],
		['开启本地匹配但缺少天数', { cert_id: '证书引用', use_local_cert: true, domains: 'example.invalid' }, '未配置'],
		['本地匹配配置完整', { cert_id: '证书引用', use_local_cert: true, domains: 'example.invalid', end_day: 30 }, '已配置'],
	])('%s', async (_name, config, expected) => {
		const node = { id: `上传节点-${_name}`, config }
		expect(await renderToString(createSSRApp(UploadNode, { node }))).toBe(expected)
	})
})
