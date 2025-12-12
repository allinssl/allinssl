import { useForm, useModalHooks } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { useWebhookChannelFormController } from './useController'
import { useStore } from '@settings/useStore'

import type { ReportWebhook, ReportType } from '@/types/setting'

/**
 * Webhook通知渠道表单组件
 */
export default defineComponent({
	name: 'WebhookChannelModel',
	props: {
		data: {
			type: Object as PropType<ReportType<ReportWebhook> | null>,
			default: () => null,
		},
	},
	setup(props: { data: ReportType<ReportWebhook> | null }) {
		const { handleError } = useError()
		const { confirm } = useModalHooks()
		const { fetchNotifyChannels } = useStore()
		const { config, rules, webhookChannelForm, submitForm } = useWebhookChannelFormController()

		if (props.data) {
			const { name, config } = props.data
			webhookChannelForm.value = {
				name,
				...config,
			}
		}
		// 使用表单hooks
		const {
			component: WebhookForm,
			example,
			data,
		} = useForm({
			config,
			defaultValue: webhookChannelForm,
			rules,
		})

		// 关联确认按钮
		confirm(async (close) => {
			try {
				const { name, ...other } = data.value
				await example.value?.validate()
				const res = await submitForm(
					{
						type: 'webhook',
						name: name || '',
						config: other,
					},
					example,
					props.data?.id,
				)

				fetchNotifyChannels()
				if (res) close()
			} catch (error) {
				handleError(error)
			}
		})

		return () => (
			<div class="webhook-channel-form">
				<WebhookForm labelPlacement="top"></WebhookForm>

				{/* 模板变量说明 */}
				<div class="mt-4 p-4 bg-gray-50 rounded-md">
					<div class="font-medium text-gray-700 mb-3 text-xl">模板变量将在发送时替换成实际值：</div>
					<div class="text-gray-600 space-y-3 text-lg">
						<div>
							<code class="px-2 py-1 bg-gray-200 rounded text-lg font-mono">__subject__</code>：通知主题
						</div>
						<div>
							<code class="px-2 py-1 bg-gray-200 rounded text-lg font-mono">__body__</code>：通知内容
						</div>
					</div>
				</div>
			</div>
		)
	},
})
