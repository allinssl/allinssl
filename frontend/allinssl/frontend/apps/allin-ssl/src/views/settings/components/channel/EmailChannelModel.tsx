import { NGrid, NFormItemGi, NInput, NSwitch, NTooltip } from 'naive-ui'
import { useForm, useModalHooks } from '@baota/naive-ui/hooks'
import { useError } from '@baota/hooks/error'
import { $t } from '@locales/index'
import { useEmailChannelFormController } from './useController'
import { useStore } from '@settings/useStore'

import type { ReportMail, ReportType } from '@/types/setting'

/**
 * 邮箱通知渠道表单组件
 */
export default defineComponent({
	name: 'EmailChannelModel',
	props: {
		data: {
			type: Object as PropType<ReportType<ReportMail> | null>,
			default: () => null,
		},
	},
	setup(props: { data: ReportType<ReportMail> | null }) {
		const { handleError } = useError()
		const { confirm } = useModalHooks()
		const { fetchNotifyChannels } = useStore()
		const { config, rules, emailChannelForm, submitForm } = useEmailChannelFormController()

		if (props.data) {
			const { name, config } = props.data
			emailChannelForm.value = {
				name,
				...config,
			}
		}
		// 使用表单hooks
		const {
			component: EmailForm,
			example,
			data,
		} = useForm({
			config,
			defaultValue: emailChannelForm,
			rules,
		})

		// 关联确认按钮
		confirm(async (close) => {
			try {
				const { name, ...other } = data.value
				await example.value?.validate()
				const res = await submitForm(
					{
						type: 'mail',
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
			<div class="email-channel-form">
				<EmailForm
					labelPlacement="top"
					v-slots={{
						'smtp-template': (formData: Ref<ReportMail>) => {
							return (
								<NGrid cols="24" xGap="24">
									<NFormItemGi span="14" label={$t('t_14_1745833932440')} path="smtpHost">
										<NInput v-model:value={formData.value.smtpHost} placeholder={$t('t_15_1745833940280')} />
									</NFormItemGi>
									<NFormItemGi span="5" label={$t('t_18_1745833933989')} path="smtpTLS">
										<NSwitch
											v-model:value={formData.value.smtpTLS}
											checkedValue="true"
											uncheckedValue="false"
											onUpdateValue={(val) => {
												formData.value.smtpPort = val === 'true' ? '465' : '25'
											}}
										/>
									</NFormItemGi>
									<NFormItemGi span="5" label={$t('t_16_1745833933819')} path="smtpPort">
										<NTooltip
											trigger="hover"
											placement="top"
											v-slots={{
												trigger: () => {
													return (
														<NInput
															v-model:value={formData.value.smtpPort}
															readonly
															class="!cursor-not-allowed"
															placeholder={$t('t_17_1745833935070')}
														/>
													)
												},
											}}
										>
											{$t('t_0_1747280814475')}
										</NTooltip>
									</NFormItemGi>
								</NGrid>
							)
						},
						'username-template': (formData: Ref<ReportMail>) => {
							return (
								<NGrid cols="24" xGap="24">
									<NFormItemGi span="24" label={$t('t_48_1745289355714')} path="password">
										<NInput
											v-model:value={formData.value.password}
											placeholder={$t('t_4_1744164840458')}
											type="password"
											showPasswordOn="click"
										/>
									</NFormItemGi>
								</NGrid>
							)
						},
					}}
				></EmailForm>
			</div>
		)
	},
})
