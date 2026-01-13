import { useForm, useModalHooks } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { useDingtalkChannelFormController } from './useController'
import { useStore } from '@settings/useStore'

import type { ReportDingtalk, ReportType } from '@/types/setting'

/**
 * 钉钉通知渠道表单组件
 */
export default defineComponent({
	name: 'DingtalkChannelModel',
	props: {
		data: {
			type: Object as PropType<ReportType<ReportDingtalk> | null>,
			default: () => null,
		},
	},
	setup(props: { data: ReportType<ReportDingtalk> | null }) {
		const { handleError } = useError()
		const { confirm } = useModalHooks()
		const { fetchNotifyChannels } = useStore()
		const { config, rules, dingtalkChannelForm, submitForm } = useDingtalkChannelFormController()

		if (props.data) {
			const { name, config } = props.data
			dingtalkChannelForm.value = {
				name,
				...config,
			}
		}
		// 使用表单hooks
		const {
			component: DingtalkForm,
			example,
			data,
		} = useForm({
			config,
			defaultValue: dingtalkChannelForm,
			rules,
		})

		// 关联确认按钮
		confirm(async (close) => {
			try {
				const { name, ...other } = data.value
				await example.value?.validate()
				const res = await submitForm(
					{
						type: 'dingtalk',
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
			<div class="dingtalk-channel-form">
				<DingtalkForm labelPlacement="top"></DingtalkForm>
			</div>
		)
	},
})
