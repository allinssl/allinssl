import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, effectScope, nextTick, reactive, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { useController } from './useController'
import EmailChannelModel from './components/channel/EmailChannelModel'
import FeishuChannelModel from './components/channel/FeishuChannelModel'
import WebhookChannelModel from './components/channel/WebhookChannelModel'
import DingtalkChannelModel from './components/channel/DingtalkChannelModel'
import WecomChannelModel from './components/channel/WecomChannelModel'
import { useNotifyProviderMultiSelectController } from '@/components/notifyProviderMultiSelect/useController'

const mocks = vi.hoisted(() => ({
	state: Object.fromEntries(['email', 'feishu', 'webhook', 'dingtalk', 'wecom'].map((type) => [`${type}ChannelForm`, { value: {} }])) as Record<string, any>,
	modal: vi.fn(), form: vi.fn(),
}))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }), useRouter: () => ({}) }))
vi.mock('@settings/useStore', () => ({ useStore: () => mocks.state }))
vi.mock('@layout/useStore', () => ({ useStore: () => mocks.state }))
vi.mock('@baota/hooks/error', () => ({ useError: () => ({ handleError: vi.fn() }) }))
vi.mock('@locales/index', () => ({ $t: (text: string) => text }))
vi.mock('@config/data', () => ({ MessagePushConfig: { mail: { name: '邮箱', type: 'mail' } } }))
vi.mock('@baota/naive-ui/hooks', () => ({
	useModal: mocks.modal,
	useMessage: () => ({ warning: vi.fn() }),
	useFormHooks: () => ({}),
	useLoadingMask: () => ({ open: vi.fn(), close: vi.fn() }),
	useModalHooks: () => ({ confirm: vi.fn() }),
	useForm: mocks.form,
}))

describe('通知账号', () => {
	it('每个渠道已经有账号时仍能打开新增表单', () => {
		const controller = useController()
		for (const open of [controller.openAddEmailChannelModal, controller.openAddFeishuChannelModal, controller.openAddWebhookChannelModal, controller.openAddDingtalkChannelModal, controller.openAddWecomChannelModal]) {
			open()
		}
		expect(mocks.modal).toHaveBeenCalledTimes(5)
	})

	it.each([
		[EmailChannelModel, 'emailChannelForm'], [FeishuChannelModel, 'feishuChannelForm'],
		[WebhookChannelModel, 'webhookChannelForm'], [DingtalkChannelModel, 'dingtalkChannelForm'],
		[WecomChannelModel, 'wecomChannelForm'],
	])('编辑后新增账号不会带入旧账号凭据：%s', async (component, formName) => {
		mocks.state[formName].value = { name: '', enabled: '1', password: '', secret: '' }
		mocks.form.mockImplementation(({ defaultValue }) => ({ data: ref(defaultValue), example: ref(null), component: () => null }))
		const legacy = { name: '旧账号', config: { enabled: '0', password: '旧密码', secret: '旧密钥' } }
		await renderToString(createSSRApp(component, { data: legacy }))
		const edit = mocks.form.mock.lastCall![0].defaultValue
		expect(edit).toMatchObject({ name: '旧账号', password: '旧密码', enabled: '0' })
		edit.password = '修改密码'
		expect(legacy.config.password).toBe('旧密码')
		await renderToString(createSSRApp(component, { data: null }))
		expect(mocks.form.mock.lastCall![0].defaultValue).toEqual({ name: '', enabled: '1', password: '', secret: '' })
	})

	it('同渠道多账号分别选择，旧监控渠道类型仍可回显和保存', async () => {
		mocks.state.notifyProvider = ref([
			{ label: '邮箱账号一', value: '1', type: 'mail' },
			{ label: '邮箱账号二', value: '2', type: 'mail' },
		])
		mocks.state.fetchNotifyProvider = vi.fn()
		const emit = vi.fn()
		const scope = effectScope()
		const props = reactive({ value: ['mail', '2'], valueType: 'value' as const })
		const controller = scope.run(() => useNotifyProviderMultiSelectController(props, emit))!
		expect(controller.selectOptions.value.map((item) => item.value)).toEqual(['1', '2', 'mail'])
		controller.handleMultiSelectUpdate(['1', '2'])
		expect(emit.mock.lastCall![1].map((item: { value: string }) => item.value)).toEqual(['1', '2'])
		props.value = ['mail', '2']
		await nextTick()
		expect(controller.selectedOptionsFull.value.map((item) => item.value)).toEqual(['mail', '2'])
		scope.stop()
	})
})
