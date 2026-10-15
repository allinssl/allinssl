import { useForm, useModalHooks } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { useWecomChannelFormController } from './useController'
import { useStore } from '@settings/useStore'

import type { ReportWecom, ReportType } from '@/types/setting'

/**
 * 企业微信通知渠道表单组件
 */
export default defineComponent({
	name: 'WecomChannelModel',
	props: {
		data: {
			type: Object as PropType<ReportType<ReportWecom> | null>,
			default: () => null,
		},
	},
	setup(props: { data: ReportType<ReportWecom> | null }) {
		const { handleError } = useError()
		const { confirm } = useModalHooks()
		const { fetchNotifyChannels } = useStore()
		const { config, rules, wecomChannelForm, submitForm } = useWecomChannelFormController()

		// 使用表单hooks
		const {
			component: WecomForm,
			example,
			data,
		} = useForm({
			config,
			defaultValue: { ...wecomChannelForm.value, ...props.data?.config, name: props.data?.name || '' },
			rules,
		})

		// 关联确认按钮
		confirm(async (close) => {
			try {
				const { name, ...other } = data.value
				await example.value?.validate()
				const res = await submitForm(
					{
						type: 'workwx',
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
			<div class="wecom-channel-form">
				<WecomForm labelPlacement="top"></WecomForm>

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
					<div class="mt-4 pt-3 border-t border-gray-200">
						<a
							href="https://developer.work.weixin.qq.com/document/path/91770"
							target="_blank"
							class="hover:opacity-80 text-xl"
							style="color: #20a50a"
						>
							📖 查看企业微信机器人消息格式教程
						</a>
					</div>
				</div>
			</div>
		)
	},
})
