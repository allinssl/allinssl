import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import UploadCertForm from './uploadCert'

const state = vi.hoisted(() => ({
	confirm: undefined as any,
	validate: vi.fn(),
	fetch: vi.fn(),
	handleError: vi.fn(),
}))
vi.mock('@baota/naive-ui/hooks', () => ({
	useFormHooks: () => ({ useFormTextarea: vi.fn() }),
	useModalHooks: () => ({ confirm: (handler: any) => { state.confirm = handler } }),
	useForm: (options: any) => ({
		component: () => null,
		data: ref(options.defaultValue),
		example: ref({ validate: state.validate }),
	}),
}))
vi.mock('@api/cert', () => ({ uploadCert: (params: any) => { return { fetch: () => state.fetch(params) } } }))
vi.mock('@baota/hooks/error', () => ({ useError: () => ({ handleError: state.handleError }) }))
vi.mock('@locales/index', () => ({ $t: (key: string) => key }))

describe('上传节点的证书上传弹窗', () => {
	beforeEach(() => { vi.resetAllMocks() })
	it('仅上传正文和私钥，列表更新成功后才关闭', async () => {
		const onUploaded = vi.fn().mockResolvedValue(undefined)
		const close = vi.fn()
		state.fetch.mockResolvedValue({ data: '新证书引用' })
		await renderToString(createSSRApp(UploadCertForm, { cert: '旧正文', privateKey: '旧私钥', onUploaded }))
		await state.confirm(close)
		expect(state.fetch).toHaveBeenCalledWith({ cert: '旧正文', key: '旧私钥' })
		expect(onUploaded).toHaveBeenCalledWith('新证书引用')
		expect(close).toHaveBeenCalledOnce()
	})
	it.each(['校验失败', '上传失败', '列表更新失败'])('%s时保留弹窗', async (step) => {
		const onUploaded = vi.fn().mockResolvedValue(undefined)
		const close = vi.fn()
		state.fetch.mockResolvedValue({ data: '新证书引用' })
		if (step === '校验失败') state.validate.mockRejectedValue(new Error(step))
		if (step === '上传失败') state.fetch.mockResolvedValue(undefined)
		if (step === '列表更新失败') onUploaded.mockRejectedValue(new Error(step))
		await renderToString(createSSRApp(UploadCertForm, { onUploaded }))
		await state.confirm(close)
		expect(close).not.toHaveBeenCalled()
		if (step === '校验失败') expect(state.fetch).not.toHaveBeenCalled()
		if (step === '上传失败') expect(onUploaded).not.toHaveBeenCalled()
	})
})
