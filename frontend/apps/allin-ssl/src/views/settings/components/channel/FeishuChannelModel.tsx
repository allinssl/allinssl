import { useForm, useModalHooks } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { useFeishuChannelFormController } from './useController'
import { useStore } from '@settings/useStore'

import type { ReportFeishu, ReportType } from '@/types/setting'

/**
 * 飞书通知渠道表单组件
 */
export default defineComponent({
	name: 'FeishuChannelModel',
	props: {
		data: {
			type: Object as PropType<ReportType<ReportFeishu> | null>,
			default: () => null,
		},
	},
	setup(props: { data: ReportType<ReportFeishu> | null }) {
		const { handleError } = useError()
		const { confirm } = useModalHooks()
		const { fetchNotifyChannels } = useStore()
		const { config, rules, feishuChannelForm, submitForm } = useFeishuChannelFormController()

		if (props.data) {
			const { name, config } = props.data
			feishuChannelForm.value = {
				name,
				...config,
			}
		}
		// 使用表单hooks
		const {
			component: FeishuForm,
			example,
			data,
		} = useForm({
			config,
			defaultValue: feishuChannelForm,
			rules,
		})

		// 关联确认按钮
		confirm(async (close) => {
			try {
				const { name, ...other } = data.value
				await example.value?.validate()
				const res = await submitForm(
					{
						type: 'feishu',
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
			<div class="feishu-channel-form">
				<FeishuForm labelPlacement="top"></FeishuForm>
			</div>
		)
	},
})
